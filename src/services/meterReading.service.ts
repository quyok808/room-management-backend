import MeterReading, { IMeterReading } from "../models/MeterReading.model";
import { CreateMeterReadingDto, UpdateMeterReadingDto } from "../dtos/meterReading.dto";
import { BulkMeterReadingDto } from "../dtos/bulkMeterReading.dto";
import { Types } from "mongoose";

export const createMeterReading = async (
  data: CreateMeterReadingDto
): Promise<IMeterReading> => {
  // Check if meter reading already exists for this room, month, and year
  const existingReading = await MeterReading.findOne({
    roomId: new Types.ObjectId(data.roomId),
    month: data.month,
    year: data.year,
  });

  if (existingReading) {
    throw new Error(`Chỉ số điện nước cho phòng này trong tháng ${data.month}/${data.year} đã tồn tại`);
  }

  // Get the last meter reading for this room to validate current readings
  const lastReading = await MeterReading.findOne({
    roomId: new Types.ObjectId(data.roomId),
  }).sort({ year: -1, month: -1 });

  if (lastReading) {
    if (data.electricityReading < lastReading.electricityReading) {
      throw new Error("Chỉ số điện hiện tại phải lớn hơn hoặc bằng chỉ số trước đó");
    }
    if (data.waterReading < lastReading.waterReading) {
      throw new Error("Chỉ số nước hiện tại phải lớn hơn hoặc bằng chỉ số trước đó");
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
  limit: number = 10
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
  id: string
): Promise<IMeterReading | null> => {
  const meterReading = await MeterReading.findById(id).populate(
    "roomId",
    "number buildingId"
  );
  return meterReading;
};

export const updateMeterReading = async (
  id: string,
  data: UpdateMeterReadingDto
): Promise<IMeterReading | null> => {
  // Get current reading to validate
  const currentReading = await MeterReading.findById(id);
  if (!currentReading) {
    throw new Error("Meter reading not found");
  }

  // If updating readings, validate against previous values
  if (data.electricityReading !== undefined && data.electricityReading < currentReading.electricityReading) {
    // Get the previous reading to ensure it doesn't go below
    const prevReading = await MeterReading.findOne({
      roomId: currentReading.roomId,
      $or: [
        { year: { $lt: currentReading.year } },
        { year: currentReading.year, month: { $lt: currentReading.month } }
      ]
    }).sort({ year: -1, month: -1 });

    if (prevReading && data.electricityReading < prevReading.electricityReading) {
      throw new Error("Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số trước đó");
    }
  }

  if (data.waterReading !== undefined && data.waterReading < currentReading.waterReading) {
    const prevReading = await MeterReading.findOne({
      roomId: currentReading.roomId,
      $or: [
        { year: { $lt: currentReading.year } },
        { year: currentReading.year, month: { $lt: currentReading.month } }
      ]
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

export const bulkUpsertMeterReadings = async (
  data: BulkMeterReadingDto
): Promise<{ success: IMeterReading[]; errors: string[] }> => {
  const results: IMeterReading[] = [];
  const errors: string[] = [];

  for (const item of data.meterReadings) {
    try {
      // Validate that readings are non-negative
      if (item.electricityReading < 0 || item.waterReading < 0) {
        errors.push(`Room ${item.roomId}: Chỉ số điện nước không được âm`);
        continue;
      }

      // Get existing reading for this room, month, and year
      const existingReading = await MeterReading.findOne({
        roomId: new Types.ObjectId(item.roomId),
        month: item.month,
        year: item.year,
      });

      if (existingReading) {
        // Update existing reading
        // Validate that new readings are not less than existing
        if (item.electricityReading < existingReading.electricityReading) {
          errors.push(`Room ${item.roomId}: Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số hiện tại (${existingReading.electricityReading})`);
          continue;
        }

        if (item.waterReading < existingReading.waterReading) {
          errors.push(`Room ${item.roomId}: Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số hiện tại (${existingReading.waterReading})`);
          continue;
        }

        const updatedReading = await MeterReading.findByIdAndUpdate(
          existingReading._id,
          {
            electricityReading: item.electricityReading,
            waterReading: item.waterReading,
          },
          { new: true }
        );

        if (updatedReading) {
          results.push(updatedReading);
        }
      } else {
        // Create new reading
        // Get the last meter reading for this room to validate current readings
        const lastReading = await MeterReading.findOne({
          roomId: new Types.ObjectId(item.roomId),
        }).sort({ year: -1, month: -1 });

        if (lastReading) {
          if (item.electricityReading < lastReading.electricityReading) {
            errors.push(`Room ${item.roomId}: Chỉ số điện phải lớn hơn hoặc bằng chỉ số trước đó (${lastReading.electricityReading})`);
            continue;
          }
          if (item.waterReading < lastReading.waterReading) {
            errors.push(`Room ${item.roomId}: Chỉ số nước phải lớn hơn hoặc bằng chỉ số trước đó (${lastReading.waterReading})`);
            continue;
          }
        }

        const newReading = await MeterReading.create({
          roomId: new Types.ObjectId(item.roomId),
          month: item.month,
          year: item.year,
          electricityReading: item.electricityReading,
          waterReading: item.waterReading,
        });

        results.push(newReading);
      }
    } catch (error: any) {
      errors.push(`Room ${item.roomId}: ${error.message}`);
    }
  }

  return { success: results, errors };
};
