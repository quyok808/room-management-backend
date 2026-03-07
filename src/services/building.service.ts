import Building, { IBuilding } from "../models/building.model";
import { CreateBuildingDto, UpdateBuildingDto } from "../dtos/building.dto";
import roomModel from "../models/room.model";

interface CreateBuildingInput extends CreateBuildingDto {
  ownerId: string; // owner user id from auth
  // Default prices for rooms
  defaultRoomPrice?: number;
  defaultElectricityUnitPrice?: number;
  defaultWaterUnitPrice?: number;
  defaultInternetFee?: number;
  defaultParkingFee?: number;
  defaultServiceFee?: number;
  area?: number;
}

export const createBuilding = async (
  data: CreateBuildingInput,
): Promise<IBuilding> => {
  const building = await Building.create(data);

  // Automatically create rooms based on totalRooms
  const rooms = [];
  for (let i = 1; i <= data.totalRooms; i++) {
    rooms.push({
      number: `${data.name}_room${i}`,
      buildingId: building._id,
      floor: Math.ceil(i / 10), // Default: 10 rooms per floor
      area: data.area , // Default area
      
      // Giá mặc định từ frontend
      price: data.defaultRoomPrice ,
      electricityUnitPrice: data.defaultElectricityUnitPrice ,
      waterUnitPrice: data.defaultWaterUnitPrice ,
      internetFee: data.defaultInternetFee ,
      parkingFee: data.defaultParkingFee ,
      serviceFee: data.defaultServiceFee ,
      
      status: "available",
      description: `Room ${i} in ${data.name}`,
    });
  }

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
