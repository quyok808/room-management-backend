import { Request, Response } from "express";
import {
  createMeterReading,
  getMeterReadings,
  getMeterReadingById,
  updateMeterReading,
  deleteMeterReading,
  bulkUpsertMeterReadings,
} from "../services/meterReading.service";
import { ROLE } from "../utils/app.constants";

export const createMeterReadingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Chỉ chủ nhà mới có thể thêm chỉ số điện nước",
      });
    }

    const meterReading = await createMeterReading(req.body);

    return res.status(201).json({
      message: "Thêm chỉ số điện nước thành công",
      data: meterReading,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getMeterReadingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { roomId, month, year, page, limit } = req.query;
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Chỉ chủ nhà mới có thể xem chỉ số điện nước",
      });
    }

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    const monthNum = month ? parseInt(month as string, 10) : undefined;
    const yearNum = year ? parseInt(year as string, 10) : undefined;

    const result = await getMeterReadings(
      roomId as string,
      monthNum,
      yearNum,
      pageNum,
      limitNum,
    );

    return res.status(200).json({
      message: "Lấy danh sách chỉ số điện nước thành công",
      data: result.meterReadings,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getMeterReadingByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Chỉ chủ nhà mới có thể xem chi tiết chỉ số điện nước",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "ID chỉ số không hợp lệ",
      });
    }

    const meterReading = await getMeterReadingById(id);

    if (!meterReading) {
      return res.status(404).json({
        message: "Không tìm thấy chỉ số điện nước",
      });
    }

    return res.status(200).json({
      message: "Lấy chi tiết chỉ số điện nước thành công",
      data: meterReading,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateMeterReadingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Chỉ chủ nhà mới có thể cập nhật chỉ số điện nước",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "ID chỉ số không hợp lệ",
      });
    }

    const meterReading = await updateMeterReading(id, req.body);

    if (!meterReading) {
      return res.status(404).json({
        message: "Không tìm thấy chỉ số điện nước",
      });
    }

    return res.status(200).json({
      message: "Cập nhật chỉ số điện nước thành công",
      data: meterReading,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteMeterReadingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Chỉ chủ nhà mới có thể xóa chỉ số điện nước",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "ID chỉ số không hợp lệ",
      });
    }

    const deleted = await deleteMeterReading(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Không tìm thấy chỉ số điện nước",
      });
    }

    return res.status(200).json({
      message: "Xóa chỉ số điện nước thành công",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const bulkUpsertMeterReadingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message:
          "Chỉ chủ nhà mới có thể thêm/cập nhật chỉ số điện nước hàng loạt",
      });
    }

    const result = await bulkUpsertMeterReadings(req.body);

    if (result.errors.length > 0 && result.success.length === 0) {
      return res.status(400).json({
        message: "Tất cả thao tác thất bại",
        errors: result.errors,
        errorRoomIds: result.errorRoomIds,
      });
    } else if (result.errors.length > 0) {
      return res.status(207).json({
        message: "Một số thao tác thành công, một số thất bại",
        success: result.success,
        errors: result.errors,
        errorRoomIds: result.errorRoomIds,
      });
    } else {
      return res.status(201).json({
        message: "Thêm/cập nhật chỉ số điện nước hàng loạt thành công",
        data: result.success,
      });
    }
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
