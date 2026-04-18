import Room, { IRoom } from "../models/room.model";
import Building from "../models/building.model";
import { UpdateRoomDto } from "../dtos/room.dto";
import { getBuildingById } from "./building.service";
import { ROOMSTATUS } from "../utils/app.constants";
import { Types } from "mongoose";
import PaymentTransaction from "../models/payment-transaction.model";
import {
  PaginationUtil,
  PaginationParams,
  PaginatedResponse,
} from "../utils/pagination.util";
import { v2 as cloudinary } from "cloudinary";

const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  if (!publicId || publicId === "") return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {}
};

const uploadImageToCloudinary = async (
  base64String: string,
): Promise<{ url: string; publicId: string }> => {
  if (!base64String || base64String === "") {
    return { url: "", publicId: "" };
  }

  if (!base64String.startsWith("data:image/")) {
    return { url: base64String, publicId: "" };
  }

  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: "users_cccd",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error("Không thể upload ảnh lên Cloudinary");
  }
};

export const updateRoom = async (
  roomId: string,
  data: UpdateRoomDto,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findOne({ _id: roomId, isDeleted: false });
  if (!room) throw new Error("Không tìm thấy phòng hoặc phòng đã bị xóa");

  const building = await Building.findOne({ _id: room.buildingId, ownerId });
  if (!building) throw new Error("Bạn không có quyền chỉnh sửa phòng này");

  if (data.number && data.number !== room.number) {
    const existingRoom = await Room.findOne({
      buildingId: room.buildingId,
      number: data.number,
      _id: { $ne: roomId },
      isDeleted: false,
    });
    if (existingRoom)
      throw new Error(`Số phòng ${data.number} đã tồn tại trong tòa nhà này`);
  }

  let updatedMembers: any[] = room.toObject().members;

  if (data.members) {
    const repCount = data.members.filter((m) => m.isRepresentative).length;
    if (repCount > 1)
      throw new Error("Một phòng chỉ được có duy nhất một người đại diện");

    const incomingMemberIds = data.members
      .filter((m) => m._id)
      .map((m) => m._id!.toString());

    const removedMembers = updatedMembers.filter(
      (m) => !incomingMemberIds.includes(m._id.toString()),
    );

    for (const removedMember of removedMembers) {
      await deleteImageFromCloudinary(removedMember.cccdImages.front.publicId);
      await deleteImageFromCloudinary(removedMember.cccdImages.back.publicId);
    }

    updatedMembers = updatedMembers.filter((m) =>
      incomingMemberIds.includes(m._id.toString()),
    );

    for (const memberData of data.members) {
      const userId =
        memberData.userId && memberData.userId.toString().length === 24
          ? new Types.ObjectId(memberData.userId)
          : null;

      if (memberData._id) {
        const index = updatedMembers.findIndex(
          (m) => m._id.toString() === memberData._id?.toString(),
        );
        if (index !== -1) {
          const existingMember = updatedMembers[index];
          let frontImageData = {
            url: existingMember.cccdImages.front.url,
            publicId: existingMember.cccdImages.front.publicId,
          };
          let backImageData = {
            url: existingMember.cccdImages.back.url,
            publicId: existingMember.cccdImages.back.publicId,
          };

          if (memberData.cccdImages?.front?.url) {
            const uploadedFront = await uploadImageToCloudinary(
              memberData.cccdImages.front.url,
            );
            if (
              uploadedFront.url !== existingMember.cccdImages.front.url &&
              uploadedFront.publicId
            ) {
              await deleteImageFromCloudinary(
                existingMember.cccdImages.front.publicId,
              );
            }
            frontImageData = uploadedFront;
          }

          if (memberData.cccdImages?.back?.url) {
            const uploadedBack = await uploadImageToCloudinary(
              memberData.cccdImages.back.url,
            );
            if (
              uploadedBack.url !== existingMember.cccdImages.back.url &&
              uploadedBack.publicId
            ) {
              await deleteImageFromCloudinary(
                existingMember.cccdImages.back.publicId,
              );
            }
            backImageData = uploadedBack;
          }

          updatedMembers[index] = {
            ...existingMember,
            ...memberData,
            cccdImages: {
              front: frontImageData,
              back: backImageData,
            },
            _id: new Types.ObjectId(memberData._id),
            userId,
          };
        }
      } else {
        const frontImageData = memberData.cccdImages?.front?.url
          ? await uploadImageToCloudinary(memberData.cccdImages.front.url)
          : { url: "", publicId: "" };
        const backImageData = memberData.cccdImages?.back?.url
          ? await uploadImageToCloudinary(memberData.cccdImages.back.url)
          : { url: "", publicId: "" };

        updatedMembers.push({
          name: memberData.name || "",
          phone: memberData.phone || "",
          licensePlate: memberData.licensePlate || "",
          isRepresentative: !!memberData.isRepresentative,
          cccdImages: {
            front: frontImageData,
            back: backImageData,
          },
          _id: new Types.ObjectId(),
          userId,
        });
      }
    }
  }

  let newStatus = data.status || room.status;
  if (updatedMembers.length > 0 && newStatus === ROOMSTATUS.AVAILABLE) {
    newStatus = ROOMSTATUS.OCCUPIED;
  } else if (
    updatedMembers.length === 0 &&
    newStatus !== ROOMSTATUS.MAINTENANCE
  ) {
    newStatus = ROOMSTATUS.AVAILABLE;
  }

  const { buildingId, members, ...safeUpdateData } = data;

  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    {
      ...safeUpdateData,
      members: updatedMembers,
      status: newStatus,
    },
    { new: true, runValidators: true },
  )
    .populate("buildingId", "name")
    .populate("members.userId", "name email phone");

  return updatedRoom;
};

export const deleteRoom = async (
  roomId: string,
  ownerId: string,
): Promise<IRoom | null> => {
  const room = await Room.findById(roomId);
  if (!room) return null;

  if (room.members && room.members.length > 0) {
    throw new Error("Cannot delete room that has tenants");
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

export const getAllRooms = async (
  searchParams?: {
    number?: string;
    buildingId?: string;
    floor?: number;
    status?: ROOMSTATUS;
  },
  pagination?: PaginationParams,
): Promise<PaginatedResponse<IRoom>> => {
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

  return await PaginationUtil.paginate(Room, query, pagination, {
    populate: [
      { path: "buildingId", select: "name" },
      { path: "members.userId", select: "name email" },
    ],
    sort: { createdAt: -1 },
  });
};

export const getRoomById = async (roomId: string): Promise<IRoom | null> => {
  const room = await Room.findOne({ _id: roomId, isDeleted: false })
    .populate("buildingId", "name")
    .populate("members.userId", "name email");
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
  // Get room IDs that already have payment transactions through invoices
  const paymentTransactions = await PaymentTransaction.aggregate([
    {
      $lookup: {
        from: "invoices",
        localField: "invoiceId",
        foreignField: "_id",
        as: "invoice",
      },
    },
    { $unwind: "$invoice" },
    {
      $group: {
        _id: "$invoice.roomId",
        hasPayments: { $sum: 1 },
      },
    },
  ]);

  const roomsWithPayments = paymentTransactions.map((pt) => pt._id);

  let query: any = {
    members: { $exists: true, $not: { $size: 0 } }, // Only rooms with members
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
    .populate("members.userId", "name email")
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
  return Room.findOne({
    "members.userId": userId,
    isDeleted: false,
  })
    .populate("buildingId", "name")
    .populate("members.userId", "name email");
};

export const getRoomsWithMeterReadings = async (
  month: number,
  year: number,
  searchParams?: {
    buildingId?: string;
    roomNumber?: string;
    buildingName?: string;
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

  if (searchParams?.roomNumber) {
    matchStage.number = { $regex: searchParams.roomNumber, $options: "i" };
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
    ...(searchParams?.buildingName
      ? [
          {
            $match: {
              "building.name": {
                $regex: searchParams.buildingName,
                $options: "i", // không phân biệt hoa thường
              },
            },
          },
        ]
      : []),
    {
      $lookup: {
        from: "users",
        localField: "members.userId",
        foreignField: "_id",
        as: "members",
      },
    },
    {
      $unwind: {
        path: "$members",
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
        parkingFee: 1,
        livingFee: 1,
        status: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        building: {
          _id: 1,
          name: 1,
          address: 1,
        },
        members: {
          userId: 1,
          name: 1,
          email: 1,
          phone: 1,
          moveInDate: 1,
          contractEndDate: 1,
          isRepresentative: 1,
          emergencyContact: 1,
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
