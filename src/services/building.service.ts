import Building, { IBuilding } from "../models/building.model";
import { CreateBuildingDto, UpdateBuildingDto } from "../dtos/building.dto";
import roomModel from "../models/room.model";

interface CreateBuildingInput {
  name: string;
  address: string;
  district: string;
  city: string;
  totalRooms: number;
  ownerId: string;
  description?: string;
  utilities?: string[];
  area?: number;
  rooms: {
    number: string;
    area: number;
    price: number;
    electricityUnitPrice: number;
    waterUnitPrice: number;
    waterPricePerPerson?: number;
    waterPricePerCubicMeter?: number;
    parkingFee?: number;
    serviceFee?: number;
    description?: string;
  }[];
}

export const createBuilding = async (
  data: CreateBuildingInput,
): Promise<IBuilding> => {
  const buildingData: any = {
    name: data.name,
    address: data.address,
    district: data.district,
    city: data.city,
    totalRooms: data.totalRooms,
    ownerId: data.ownerId,
  };

  if (data.description !== undefined)
    buildingData.description = data.description;
  if (data.utilities !== undefined) buildingData.utilities = data.utilities;

  const building = await Building.create(buildingData);

  // Create rooms from frontend data
  const rooms = data.rooms.map((room) => ({
    ...room,
    buildingId: building._id,
    status: "available",
  }));

  if (rooms.length > 0) {
    await roomModel.insertMany(rooms);
  }

  return building;
};

export const getBuildingById = async (
  buildingId: string,
): Promise<IBuilding | null> => {
  const building = await Building.findById(buildingId);
  return building;
};

export const getBuildingsByOwner = async (
  ownerId: string,
): Promise<IBuilding[]> => {
  const buildings = await Building.find({ ownerId: ownerId, isDeleted: false });
  return buildings;
};

export const getAllBuildings = async (
  searchParams?: {
    name?: string;
    address?: string;
    district?: string;
    city?: string;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) => {
  let query: any = {
    isDeleted: false,
  };

  if (searchParams?.name) {
    query.name = { $regex: searchParams.name, $options: "i" };
  }

  if (searchParams?.address) {
    query.address = { $regex: searchParams.address, $options: "i" };
  }

  if (searchParams?.district) {
    query.district = { $regex: searchParams.district, $options: "i" };
  }

  if (searchParams?.city) {
    query.city = { $regex: searchParams.city, $options: "i" };
  }

  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 10));
  const skip = (page - 1) * limit;

  const [total, buildings] = await Promise.all([
    Building.countDocuments(query),
    Building.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const totalPages = Math.ceil(total / limit);

  // 🔥 lấy room stats cho tất cả buildings cùng lúc
  const buildingIds = buildings.map((b) => b._id);

  const roomStats = await roomModel.aggregate([
    {
      $match: {
        buildingId: { $in: buildingIds },
      },
    },
    {
      $group: {
        _id: {
          buildingId: "$buildingId",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // convert aggregation → object map
  const statsMap: Record<string, any> = {};

  roomStats.forEach((stat) => {
    const buildingId = stat._id.buildingId.toString();
    const status = stat._id.status;

    if (!statsMap[buildingId]) {
      statsMap[buildingId] = {
        available: 0,
        occupied: 0,
        maintenance: 0,
      };
    }

    statsMap[buildingId][status] = stat.count;
  });

  // attach vào building
  const enrichedBuildings = buildings.map((b) => ({
    ...b,
    roomStatus: statsMap[b._id.toString()] || {
      available: 0,
      occupied: 0,
      maintenance: 0,
    },
  }));

  return {
    buildings: enrichedBuildings,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const updateBuilding = async (
  buildingId: string,
  data: UpdateBuildingDto,
  ownerId: string,
): Promise<IBuilding | null> => {
  // Check if building has any occupied rooms
  const occupiedRoomsCount = await roomModel.countDocuments({
    buildingId: buildingId,
    currentTenant: { $exists: true, $ne: null },
  });

  if (occupiedRoomsCount > 0) {
    throw new Error("Cannot update building with occupied rooms");
  }

  const building = await Building.findOneAndUpdate(
    { _id: buildingId, ownerId: ownerId },
    data,
    { new: true },
  );
  return building;
};

export const deleteBuilding = async (
  buildingId: string,
  ownerId: string,
): Promise<IBuilding | null> => {
  // Check if building has any occupied rooms
  const occupiedRoomsCount = await roomModel.countDocuments({
    buildingId: buildingId,
    currentTenant: { $exists: true, $ne: null },
  });

  if (occupiedRoomsCount > 0) {
    throw new Error("Cannot delete building with occupied rooms");
  }

  const building = await Building.findOneAndUpdate(
    { _id: buildingId, ownerId: ownerId },
    { isDeleted: true },
    { new: true },
  );

  // Soft delete all rooms in the building
  await roomModel.updateMany({ buildingId: buildingId }, { isDeleted: true });

  return building;
};
