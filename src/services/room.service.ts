import Room, { IRoom } from "../models/room.model";
import Building from "../models/building.model";
import { UpdateRoomDto } from "../dtos/room.dto";
import { getBuildingById } from "./building.service";
import { ROOMSTATUS, TenantStatus } from "../utils/app.constants";
import { Types } from "mongoose";
import Tenant from "../models/tenant.model";
import Payment from "../models/payment.model";
import MeterReading from "../models/MeterReading.model";

export const updateRoom = async (
  roomId: string,
  data: UpdateRoomDto,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findById(roomId);
  if (!room) return null;

  const building = await getBuildingById(room.buildingId.toString());
  if (!building || building.ownerId.toString() !== ownerId) return null;

  const updatedRoom = await Room.findByIdAndUpdate(roomId, data, { new: true });
  return updatedRoom;
};

export const deleteRoom = async (
  roomId: string,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findById(roomId);
  if (!room) return null;

  if (room.currentTenant) {
    throw new Error("Cannot delete room that has a tenant");
  }

  const building = await getBuildingById(room.buildingId.toString());
  if (!building || building.ownerId.toString() !== ownerId) return null;

  const deletedRoom = await Room.findByIdAndDelete(roomId);

  if (deletedRoom) {
    await Building.findByIdAndUpdate(building._id, {
      $inc: { totalRooms: -1 },
    });
  }

  return deletedRoom;
};

export const assignTenant = async (
  roomId: string,
  userId: string,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findById(roomId);
  if (!room) return null;

  const building = await getBuildingById(room.buildingId.toString());
  if (!building || building.ownerId.toString() !== ownerId) return null;

  if (room.status !== ROOMSTATUS.AVAILABLE) {
    throw new Error("Room is not available for assignment");
  }

  await Tenant.create({
    userId: new Types.ObjectId(userId),
    roomId: new Types.ObjectId(roomId),
    moveInDate: new Date(),
    contractEndDate: null,
    emergencyContact: "",
    status: TenantStatus.ACTIVE,
  });

  room.currentTenant = new Types.ObjectId(userId);
  room.status = ROOMSTATUS.OCCUPIED;
  await room.save();

  return room;
};

export const removeTenant = async (
  roomId: string,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findById(roomId);
  if (!room) return null;

  const building = await getBuildingById(room.buildingId.toString());
  if (!building || building.ownerId.toString() !== ownerId) return null;

  if (!room.currentTenant) {
    throw new Error("Room has no tenant to remove");
  }

  await Tenant.findOneAndUpdate(
    {
      roomId: new Types.ObjectId(roomId),
      userId: room.currentTenant,
      status: TenantStatus.ACTIVE,
    },
    {
      status: TenantStatus.INACTIVE,
      contractEndDate: new Date(),
    },
  );

  room.set("currentTenant", undefined);
  room.status = ROOMSTATUS.AVAILABLE;
  await room.save();

  return room;
};

export const getAllRooms = async (
  searchParams?: {
    number?: string;
    buildingId?: string;
    floor?: number;
    status?: ROOMSTATUS;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) => {
  let query: any = {
    isDeleted: false,
  };

  if (searchParams?.number) {
    query.number = { $regex: searchParams.number, $options: "i" };
  }

  if (searchParams?.buildingId) {
    query.buildingId = new Types.ObjectId(searchParams.buildingId);
  }

  if (searchParams?.floor !== undefined) {
    query.floor = searchParams.floor;
  }

  if (searchParams?.status) {
    query.status = searchParams.status;
  }

  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 10));
  const skip = (page - 1) * limit;

  const total = await Room.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const rooms = await Room.find(query)
    .populate("buildingId", "name")
    .populate("currentTenant", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    rooms,
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

export const getRoomById = async (roomId: string): Promise<IRoom | null> => {
  const room = await Room.findOne({ _id: roomId, isDeleted: false })
    .populate("buildingId", "name")
    .populate("currentTenant", "name email");
  return room;
};

export const getOccupiedRooms = async (
  searchParams?: {
    buildingId?: string;
    floor?: number;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) => {
  // Get room IDs that already have payments
  const roomsWithPayments = await Payment.distinct('roomId');

  let query: any = {
    currentTenant: { $exists: true, $ne: null }, // Only rooms with current tenant
    status: ROOMSTATUS.OCCUPIED,
    _id: { $nin: roomsWithPayments }, // Exclude rooms that have payments
    isDeleted: false,
  };

  // Filter by buildingId
  if (searchParams?.buildingId) {
    query.buildingId = new Types.ObjectId(searchParams.buildingId);
  }

  // Filter by floor
  if (searchParams?.floor !== undefined) {
    query.floor = searchParams.floor;
  }

  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 10));
  const skip = (page - 1) * limit;

  const total = await Room.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const rooms = await Room.find(query)
    .populate("buildingId", "name")
    .populate("currentTenant", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    rooms,
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

export const getRoomByUserId = (userId: string) => {
  return Room.findOne({ currentTenant: userId, isDeleted: false }).populate("buildingId", "name");
};

export const getRoomsWithMeterReadings = async (
  month: number,
  year: number,
  searchParams?: {
    buildingId?: string;
    floor?: number;
  },
  pagination?: {
    page?: number;
    limit?: number;
  },
) => {
  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 10));
  const skip = (page - 1) * limit;

  let matchStage: any = {
    isDeleted: false,
  };

  if (searchParams?.buildingId) {
    matchStage.buildingId = new Types.ObjectId(searchParams.buildingId);
  }

  if (searchParams?.floor !== undefined) {
    matchStage.floor = searchParams.floor;
  }

  const rooms = await Room.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: "buildings",
        localField: "buildingId",
        foreignField: "_id",
        as: "building",
      },
    },
    {
      $unwind: {
        path: "$building",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "currentTenant",
        foreignField: "_id",
        as: "tenant",
      },
    },
    {
      $unwind: {
        path: "$tenant",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "meterreadings",
        let: {
          roomId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$roomId", "$$roomId"] },
                  { $eq: ["$month", month] },
                  { $eq: ["$year", year] },
                ],
              },
            },
          },
        ],
        as: "meterReading",
      },
    },
    {
      $unwind: {
        path: "$meterReading",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        number: 1,
        area: 1,
        price: 1,
        electricityUnitPrice: 1,
        waterPricePerPerson: 1,
        waterPricePerCubicMeter: 1,
        internetFee: 1,
        parkingFee: 1,
        serviceFee: 1,
        status: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        building: {
          _id: 1,
          name: 1,
          address: 1,
        },
        tenant: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
        },
        meterReading: {
          _id: 1,
          month: 1,
          year: 1,
          electricityReading: 1,
          waterReading: 1,
          createdAt: 1,
        },
      },
    },
    {
      $sort: { "building.name": 1, number: 1 },
    },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const result = rooms[0];
  const total = result.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    rooms: result.data,
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
