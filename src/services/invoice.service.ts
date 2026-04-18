import Room from "../models/room.model";
import MeterReading from "../models/MeterReading.model";
import Building from "../models/building.model";
import Invoice from "../models/invoice.model";
import { InvoicePreviewItem } from "../interfaces/invoice.interface";
import { Types } from "mongoose";
import { InvoiceStatus } from "../models/invoice.model";
import mongoose from "mongoose";

export class InvoiceService {
  // Helper function to fill base fees
  private static fillBaseFees(room: any, roomData: InvoicePreviewItem) {
    roomData.rentAmount = room.price || 0;
    roomData.livingFee = room.livingFee || 0;
    roomData.parkingFee = room.parkingFee || 0;
    roomData.otherFee = 0;
    roomData.electricityUsage = 0;
    roomData.electricityCost = 0;
    roomData.waterUsage = 0;

    // Tính tiền nước cơ bản cho trường hợp lỗi
    let waterCost = 0;
    const waterPricePerPerson = room.waterPricePerPerson || 0;
    const waterPricePerCubicMeter = room.waterPricePerCubicMeter || 0;

    if (waterPricePerPerson > 0) {
      // Tính theo người - lấy giá đó luôn
      waterCost = waterPricePerPerson;
    }
    // Không tính theo m3 khi có lỗi vì không có usage data

    roomData.waterCost = waterCost;

    roomData.totalAmount =
      (roomData.rentAmount || 0) +
      (roomData.livingFee || 0) +
      (roomData.parkingFee || 0) +
      waterCost;
  }

  static async getInvoicePreview(
    month?: number,
    year?: number,
    buildingId?: string,
  ): Promise<InvoicePreviewItem[]> {
    const results: InvoicePreviewItem[] = [];

    // 1. Lấy danh sách room theo building (chỉ populate name)
    const roomFilter = buildingId
      ? { buildingId: new Types.ObjectId(buildingId), isDeleted: false }
      : { isDeleted: false };

    const rooms = await Room.find(roomFilter)
      .populate("buildingId", "name")
      .populate("currentTenant", "fullName");

    if (rooms.length === 0) {
      return results;
    }

    // 2. Tính tháng trước - chỉ khi có month
    let prevMonth: number | undefined;
    let prevYear: number | undefined;

    if (month && year) {
      prevMonth = month - 1;
      prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
    }

    // Extract room IDs for queries
    const roomIds = rooms.map((r) => r._id);

    // 3. Query 1 lần tất cả readings - chỉ khi có month
    let readings: any[] = [];
    if (month && year) {
      readings = await MeterReading.find({
        roomId: { $in: roomIds },
        $or: [
          { month, year },
          { month: prevMonth!, year: prevYear! },
        ],
      });
    }

    // 4. Map readings để lookup nhanh
    const readingMap = new Map<string, any>();
    readings.forEach((r) => {
      const key = `${r.roomId}_${r.month}_${r.year}`;
      readingMap.set(key, r);
    });

    // 5. Query 1 lần tất cả existing invoices (FIX TRÙNG HÓA ĐƠN)
    const invoiceQuery: any = { roomId: { $in: roomIds } };
    if (month !== undefined) invoiceQuery.month = month;
    if (year !== undefined) invoiceQuery.year = year;

    const existingInvoices = await Invoice.find(invoiceQuery);

    // 6. Process mỗi room
    for (const room of rooms) {
      const building = room.buildingId as any;
      const roomData: InvoicePreviewItem = {
        roomId: room._id.toString(),
        roomName: room.number,
        buildingName: building?.name || "Unknown",
        canCreateInvoice: false,
      };

      try {
        // 7. Check đã có invoice chưa
        const existingInvoice = existingInvoices.find(
          (inv) => inv.roomId.toString() === room._id.toString(),
        );

        if (existingInvoice) {
          roomData.electricityUsage = existingInvoice.electricityUsage;
          roomData.electricityCost = existingInvoice.electricityCost;
          roomData.waterUsage = existingInvoice.waterUsage;
          roomData.waterCost = existingInvoice.waterCost;

          roomData.rentAmount = existingInvoice.rentAmount;
          roomData.livingFee = existingInvoice.livingFee;
          roomData.parkingFee = existingInvoice.parkingFee;
          roomData.otherFee = existingInvoice.otherFee;

          roomData.totalAmount = existingInvoice.totalAmount;

          roomData.canCreateInvoice = false;
          roomData.error = "Đã có hóa đơn";

          results.push(roomData);
          continue;
        }

        // 8. Lấy readings từ map
        const currentReading = readingMap.get(`${room._id}_${month}_${year}`);
        const previousReading = readingMap.get(
          `${room._id}_${prevMonth}_${prevYear}`,
        );

        // 9. Validate readings với message rõ ràng
        if (!currentReading && !previousReading) {
          roomData.error = "Thiếu chỉ số tháng hiện tại và tháng trước";
          this.fillBaseFees(room, roomData);
          results.push(roomData);
          continue;
        } else if (!currentReading) {
          roomData.error = "Thiếu chỉ số tháng hiện tại";
          this.fillBaseFees(room, roomData);
          results.push(roomData);
          continue;
        } else if (!previousReading) {
          roomData.error = "Thiếu chỉ số tháng trước";
          this.fillBaseFees(room, roomData);
          results.push(roomData);
          continue;
        }

        // 10. Tính toán usage
        const electricityUsage =
          currentReading.electricityReading -
          previousReading.electricityReading;
        const waterUsage =
          currentReading.waterReading - previousReading.waterReading;

        // 11. Validate usage với message riêng biệt
        if (electricityUsage < 0) {
          roomData.error = "Chỉ số điện không hợp lệ";
          this.fillBaseFees(room, roomData);
          results.push(roomData);
          continue;
        }

        if (waterUsage < 0) {
          roomData.error = "Chỉ số nước không hợp lệ";
          this.fillBaseFees(room, roomData);
          results.push(roomData);
          continue;
        }

        // 12. Tính costs
        const electricityCost =
          electricityUsage * (room.electricityUnitPrice || 0);

        // Tính tiền nước - ưu tiên tính theo người trước
        let waterCost = 0;
        const waterPricePerPerson = room.waterPricePerPerson || 0;
        const waterPricePerCubicMeter = room.waterPricePerCubicMeter || 0;

        if (waterPricePerPerson > 0) {
          // Tính theo người - lấy giá đó luôn
          waterCost = waterPricePerPerson;
        } else if (waterPricePerCubicMeter > 0) {
          // Tính theo m3 - mới tính usage
          waterCost = waterUsage * waterPricePerCubicMeter;
        }

        // 13. Tổng các phí
        const rentAmount = room.price || 0;
        const livingFee = room.livingFee || 0;
        const parkingFee = room.parkingFee || 0;
        const otherFee = 0;

        const totalAmount =
          electricityCost +
          waterCost +
          rentAmount +
          livingFee +
          parkingFee +
          otherFee;

        // 14. Gán kết quả
        roomData.electricityUsage = electricityUsage;
        roomData.electricityCost = electricityCost;
        roomData.waterUsage = waterUsage;
        roomData.waterCost = waterCost;
        roomData.rentAmount = rentAmount;
        roomData.livingFee = livingFee;
        roomData.parkingFee = parkingFee;
        roomData.otherFee = otherFee;
        roomData.totalAmount = totalAmount;
        roomData.canCreateInvoice = true;

        results.push(roomData);
      } catch (error) {
        console.error(`Error processing room ${room._id}:`, error);
        roomData.error = "Lỗi xử lý";
        this.fillBaseFees(room, roomData);
        results.push(roomData);
      }
    }

    return results;
  }

  static async getInvoiceById(invoiceId: string) {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new Error("ID hóa đơn không hợp lệ");
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("tenantId", "name email phone cccd")
      .populate("roomId", "number")
      .populate({
        path: "roomId",
        populate: {
          path: "buildingId",
          select: "name",
        },
      })
      .lean();

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn");
    }

    return invoice;
  }

  static async deleteInvoice(invoiceId: string) {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new Error("ID hóa đơn không hợp lệ");
    }

    const invoice = await Invoice.findByIdAndDelete(invoiceId);

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn");
    }

    return invoice;
  }

  static async bulkCreateInvoices(
    roomIds: string[],
    month?: number,
    year?: number,
  ): Promise<{ created: number; failed: any[] }> {
    const created = 0;
    const failed: any[] = [];

    // 1. Validate ObjectId từ FE
    const validRoomIds = roomIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validRoomIds.length === 0) {
      return {
        created: 0,
        failed: roomIds.map((id) => ({
          roomId: id,
          error: "ID phòng không hợp lệ",
        })),
      };
    }

    // 2. Tính tháng trước - chỉ khi có month và year
    let prevMonth: number | undefined;
    let prevYear: number | undefined;

    if (month !== undefined && year !== undefined) {
      prevMonth = month - 1;
      prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
    }

    // 3. Query 1 lần tất cả data cần thiết
    const rooms = await Room.find({
      _id: { $in: validRoomIds.map((id) => new Types.ObjectId(id)) },
    })
      .populate("buildingId", "name")
      .populate("currentTenant", "fullName");

    const allRoomIds = rooms.map((r) => r._id);

    // Check existing invoices - chỉ khi có month và year
    let existingInvoices: any[] = [];
    if (month !== undefined && year !== undefined) {
      existingInvoices = await Invoice.find({
        roomId: { $in: allRoomIds },
        month,
        year,
      });
    }

    const existingInvoiceMap = new Set<string>();
    existingInvoices.forEach((invoice) => {
      existingInvoiceMap.add(invoice.roomId.toString());
    });

    // Get meter readings - chỉ khi có month và year
    let readings: any[] = [];
    if (month !== undefined && year !== undefined) {
      readings = await MeterReading.find({
        roomId: { $in: allRoomIds },
        $or: [
          { month, year },
          { month: prevMonth!, year: prevYear! },
        ],
      });
    }

    // Map readings để lookup nhanh
    const readingMap = new Map<string, any>();
    readings.forEach((r) => {
      const key = `${r.roomId}_${r.month}_${r.year}`;
      readingMap.set(key, r);
    });

    // 3. Process từng room để tạo invoice
    const invoicesToCreate = [];

    for (const room of rooms) {
      try {
        // 4. Chặn phòng chưa có tenant
        if (!room.currentTenant?._id) {
          failed.push({
            roomId: room._id.toString(),
            roomName: room.number,
            error: "Phòng chưa có người thuê",
          });
          continue;
        }

        // Check đã có invoice chưa
        if (existingInvoiceMap.has(room._id.toString())) {
          failed.push({
            roomId: room._id.toString(),
            roomName: room.number,
            error: "Đã có hóa đơn",
          });
          continue;
        }

        // Lấy readings
        const currentReading = readingMap.get(`${room._id}_${month}_${year}`);
        const previousReading = readingMap.get(
          `${room._id}_${prevMonth}_${prevYear}`,
        );

        // Validate readings
        if (!currentReading || !previousReading) {
          failed.push({
            roomId: room._id.toString(),
            roomName: room.number,
            error:
              !currentReading && !previousReading
                ? "Thiếu chỉ số tháng hiện tại và tháng trước"
                : !currentReading
                  ? "Thiếu chỉ số tháng hiện tại"
                  : "Thiếu chỉ số tháng trước",
          });
          continue;
        }

        // Tính usage
        const electricityUsage =
          currentReading.electricityReading -
          previousReading.electricityReading;
        const waterUsage =
          currentReading.waterReading - previousReading.waterReading;

        // Validate usage
        if (electricityUsage < 0 || waterUsage < 0) {
          failed.push({
            roomId: room._id.toString(),
            roomName: room.number,
            error:
              electricityUsage < 0
                ? "Chỉ số điện không hợp lệ"
                : "Chỉ số nước không hợp lệ",
          });
          continue;
        }

        // Tính costs (KHÔNG tin FE)
        const electricityCost =
          electricityUsage * (room.electricityUnitPrice || 0);

        let waterCost = 0;
        const waterPricePerPerson = room.waterPricePerPerson || 0;
        const waterPricePerCubicMeter = room.waterPricePerCubicMeter || 0;

        if (waterPricePerPerson > 0) {
          waterCost = waterPricePerPerson;
        } else if (waterPricePerCubicMeter > 0) {
          waterCost = waterUsage * waterPricePerCubicMeter;
        }

        // Tổng các phí
        const rentAmount = room.price || 0;
        const livingFee = room.livingFee || 0;
        const parkingFee = room.parkingFee || 0;
        const otherFee = 0;

        const totalAmount =
          waterCost + rentAmount + livingFee + parkingFee + otherFee;

        // Create invoice document với validation
        const invoiceData = {
          tenantId: room.currentTenant._id, // Bắt buộc có tenant
          roomId: room._id,
          month,
          year,
          electricityPrevious: previousReading.electricityReading,
          electricityCurrent: currentReading.electricityReading,
          electricityUsage,
          electricityUnitPrice: room.electricityUnitPrice || 0,
          electricityCost,
          waterPrevious: previousReading.waterReading,
          waterCurrent: currentReading.waterReading,
          waterUsage,
          waterUnitPrice: waterPricePerCubicMeter || 0,
          waterCost,
          rentAmount,
          parkingFee,
          livingFee,
          otherFee,
          totalAmount,
          dueDate:
            month !== undefined && year !== undefined
              ? new Date(year, month, 5)
              : new Date(), // Due on 5th of next month or current date if undefined
          notes: "", // Default empty notes
          status: InvoiceStatus.UNPAID,
        };

        invoicesToCreate.push(invoiceData);
      } catch (error) {
        console.error(`Error processing room ${room._id}:`, error);
        failed.push({
          roomId: room._id.toString(),
          roomName: room.number,
          error: "Lỗi xử lý",
        });
      }
    }

    // 5. Debug log trước khi insert
    console.log("DATA INSERT:", invoicesToCreate);

    // 6. Bulk create invoices với error handling
    if (invoicesToCreate.length > 0) {
      try {
        await Invoice.insertMany(invoicesToCreate, { ordered: false });
      } catch (err) {
        console.error("INSERT MANY ERROR:", err);
        // Không throw error để không crash toàn bộ batch
        // Thay vào đó, add tất cả vào failed
        invoicesToCreate.forEach((invoice: any) => {
          failed.push({
            roomId: invoice.roomId.toString(),
            error: "Lỗi khi tạo hóa đơn",
          });
        });
        return {
          created: 0,
          failed,
        };
      }
    }

    return {
      created: invoicesToCreate.length,
      failed,
    };
  }

  static async getInvoices(options: {
    month?: number;
    year?: number;
    buildingId?: string;
    roomId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { month, year, buildingId, roomId, status, page, limit } = options;

    // Build filter
    const filter: any = {};

    if (month !== undefined && year !== undefined) {
      filter.month = month;
      filter.year = year;
    }

    if (buildingId) {
      const buildingRooms = await Room.find({
        buildingId: new Types.ObjectId(buildingId),
      }).distinct("_id");
      filter.roomId = { $in: buildingRooms };
    }

    if (roomId) {
      filter.roomId = new Types.ObjectId(roomId);
    }

    if (status) {
      filter.status = status;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Query with pagination
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .select(
          "tenantId roomId month year electricityPrevious electricityCurrent electricityUsage electricityUnitPrice electricityCost waterPrevious waterCurrent waterUsage waterUnitPrice waterCost rentAmount parkingFee livingFee otherFee totalAmount dueDate notes status createdAt updatedAt",
        )
        .populate("tenantId", "name email phone")
        .populate("roomId", "number")
        .populate({
          path: "roomId",
          populate: {
            path: "buildingId",
            select: "name",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    // Format response
    const totalPages = Math.ceil(total / limit);

    return {
      invoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
