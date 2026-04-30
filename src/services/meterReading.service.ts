import MeterReading, { IMeterReading } from "../models/MeterReading.model";
import {
  CreateMeterReadingDto,
  UpdateMeterReadingDto,
} from "../dtos/meterReading.dto";
import { BulkMeterReadingDto } from "../dtos/bulkMeterReading.dto";
import { Types } from "mongoose";
import { getRoomById } from "./room.service";
import { getBuildingById } from "./building.service";

export const createMeterReading = async (
  data: CreateMeterReadingDto,
): Promise<IMeterReading> => {
  const existingReading = await MeterReading.findOne({
    roomId: new Types.ObjectId(data.roomId),
    month: data.month,
    year: data.year,
  });

  if (existingReading) {
    throw new Error(
      `Chỉ số điện nước cho phòng này trong tháng ${data.month}/${data.year} đã tồn tại`,
    );
  }

  const lastReading = await MeterReading.findOne({
    roomId: new Types.ObjectId(data.roomId),
  }).sort({ year: -1, month: -1 });

  if (lastReading) {
    if (data.electricityReading < lastReading.electricityReading) {
      throw new Error(
        "Chỉ số điện hiện tại phải lớn hơn hoặc bằng chỉ số trước đó",
      );
    }
    if (data.waterReading < lastReading.waterReading) {
      throw new Error(
        "Chỉ số nước hiện tại phải lớn hơn hoặc bằng chỉ số trước đó",
      );
    }
  }

  const meterReading = await MeterReading.create({
    roomId: new Types.ObjectId(data.roomId),
    month: data.month,
    year: data.year,
    electricityReading: data.electricityReading,
    waterReading: data.waterReading,
  });

  return meterReading;
};

export const getMeterReadings = async (
  roomId?: string,
  month?: number,
  year?: number,
  page: number = 1,
  limit: number = 10,
) => {
  let query: any = {};

  if (roomId) {
    query.roomId = new Types.ObjectId(roomId);
  }

  if (month !== undefined) {
    query.month = month;
  }

  if (year !== undefined) {
    query.year = year;
  }

  const skip = (page - 1) * limit;
  const total = await MeterReading.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const meterReadings = await MeterReading.find(query)
    .populate("roomId", "number buildingId")
    .sort({ year: -1, month: -1 })
    .skip(skip)
    .limit(limit);

  return {
    meterReadings,
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

export const getMeterReadingById = async (
  id: string,
): Promise<IMeterReading | null> => {
  const meterReading = await MeterReading.findById(id).populate(
    "roomId",
    "number buildingId",
  );
  return meterReading;
};

export const updateMeterReading = async (
  id: string,
  data: UpdateMeterReadingDto,
): Promise<IMeterReading | null> => {
  // Get current reading to validate
  const currentReading = await MeterReading.findById(id);
  if (!currentReading) {
    throw new Error("Meter reading not found");
  }

  // If updating readings, validate against previous values
  if (
    data.electricityReading !== undefined &&
    data.electricityReading < currentReading.electricityReading
  ) {
    // Get the previous reading to ensure it doesn't go below
    const prevReading = await MeterReading.findOne({
      roomId: currentReading.roomId,
      $or: [
        { year: { $lt: currentReading.year } },
        { year: currentReading.year, month: { $lt: currentReading.month } },
      ],
    }).sort({ year: -1, month: -1 });

    if (
      prevReading &&
      data.electricityReading < prevReading.electricityReading
    ) {
      throw new Error("Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số trước đó");
    }
  }

  if (
    data.waterReading !== undefined &&
    data.waterReading < currentReading.waterReading
  ) {
    const prevReading = await MeterReading.findOne({
      roomId: currentReading.roomId,
      $or: [
        { year: { $lt: currentReading.year } },
        { year: currentReading.year, month: { $lt: currentReading.month } },
      ],
    }).sort({ year: -1, month: -1 });

    if (prevReading && data.waterReading < prevReading.waterReading) {
      throw new Error("Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số trước đó");
    }
  }

  const meterReading = await MeterReading.findByIdAndUpdate(id, data, {
    new: true,
  });
  return meterReading;
};

export const deleteMeterReading = async (id: string): Promise<boolean> => {
  const result = await MeterReading.findByIdAndDelete(id);
  return result !== null;
};

const validateReading = (
  value: number,
  prev?: number,
  next?: number,
  type = "điện",
) => {
  if (prev !== undefined && value < prev) {
    return `Chỉ số ${type} phải lớn hơn hoặc bằng tháng trước (Tháng trước: ${prev})`;
  }
  if (next !== undefined && value > next) {
    return `Chỉ số ${type} phải nhỏ hơn hoặc bằng tháng sau (Tháng sau: ${next})`;
  }
  return null;
};

export const bulkUpsertMeterReadings = async (
  data: BulkMeterReadingDto,
): Promise<{
  success: IMeterReading[];
  errors: string[];
  errorRoomIds: string[];
}> => {
  const results: IMeterReading[] = [];
  const errors: string[] = [];
  const errorRoomIds: string[] = [];

  for (const item of data.meterReadings) {
    const room = await getRoomById(item.roomId);
    const building = await getBuildingById(
      room?.buildingId._id.toString() ?? "",
    );
    try {
      if (item.electricityReading < 0 || item.waterReading < 0) {
        errors.push(
          `「${room?.number} - ${building?.name}」: Chỉ số điện nước không được âm`,
        );
        errorRoomIds.push(item.roomId);

        continue;
      }

      const roomObjectId = new Types.ObjectId(item.roomId);

      const prevReading = await MeterReading.findOne({
        roomId: roomObjectId,
        $or: [
          { year: item.year, month: { $lt: item.month } },
          { year: { $lt: item.year } },
        ],
      }).sort({ year: -1, month: -1 });

      const nextReading = await MeterReading.findOne({
        roomId: roomObjectId,
        $or: [
          { year: item.year, month: { $gt: item.month } },
          { year: { $gt: item.year } },
        ],
      }).sort({ year: 1, month: 1 });

      const elecError = validateReading(
        item.electricityReading,
        prevReading?.electricityReading,
        nextReading?.electricityReading,
        "điện",
      );

      if (elecError) {
        errors.push(`「${room?.number} - ${building?.name}」: ${elecError}`);
        errorRoomIds.push(item.roomId);

        continue;
      }

      const waterError = validateReading(
        item.waterReading,
        prevReading?.waterReading,
        nextReading?.waterReading,
        "nước",
      );

      if (waterError) {
        errors.push(`「${room?.number} - ${building?.name}」: ${waterError}`);
        errorRoomIds.push(item.roomId);

        continue;
      }

      const updated = await MeterReading.findOneAndUpdate(
        {
          roomId: roomObjectId,
          month: item.month,
          year: item.year,
        },
        {
          electricityReading: item.electricityReading,
          waterReading: item.waterReading,
          updatedAt: new Date(),
        },
        {
          new: true,
          upsert: true,
        },
      );

      if (updated) {
        results.push(updated);
      }
    } catch (error: any) {
      errors.push(`「${room?.number} - ${building?.name}」: ${error.message}`);
      errorRoomIds.push(item.roomId);
    }
  }

  return { success: results, errors, errorRoomIds };
};
