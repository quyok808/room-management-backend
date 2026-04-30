import { Request, Response } from "express";
import {
  getInvoicePreview,
  bulkCreateInvoices,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
} from "../services/invoice.service";

export const getInvoicePreviewController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { month, year, buildingId } = req.query;
    if (
      month &&
      (isNaN(parseInt(month as string)) ||
        parseInt(month as string) < 1 ||
        parseInt(month as string) > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ",
      });
    }

    if (year && isNaN(parseInt(year as string))) {
      return res.status(400).json({
        success: false,
        message: "Năm không hợp lệ",
      });
    }

    const monthNum = month ? parseInt(month as string) : undefined;
    const yearNum = year ? parseInt(year as string) : undefined;

    if (buildingId && typeof buildingId === "object") {
      console.error("buildingId is object in getInvoicePreview:", buildingId);
      return res.status(400).json({
        success: false,
        message: "buildingId must be a string, not an object",
      });
    }

    const result = await getInvoicePreview(
      monthNum,
      yearNum,
      buildingId as string,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getInvoicePreview:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const bulkCreateInvoicesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { roomIds, month, year } = req.body;

    // Validate required params
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách roomIds không hợp lệ",
      });
    }

    // Validate optional params
    if (
      month &&
      (isNaN(parseInt(month as string)) ||
        parseInt(month as string) < 1 ||
        parseInt(month as string) > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ",
      });
    }

    if (year && isNaN(parseInt(year as string))) {
      return res.status(400).json({
        success: false,
        message: "Năm không hợp lệ",
      });
    }

    const monthNum = month ? parseInt(month as string) : undefined;
    const yearNum = year ? parseInt(year as string) : undefined;

    const result = await bulkCreateInvoices(roomIds, monthNum, yearNum);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in bulkCreateInvoices:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getInvoicesController = async (req: Request, res: Response) => {
  try {
    const {
      month,
      year,
      buildingId,
      roomId,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate optional params - month/year now optional for full list
    if (
      month &&
      (isNaN(parseInt(month as string)) ||
        parseInt(month as string) < 1 ||
        parseInt(month as string) > 12)
    ) {
      return res.status(400).json({
        success: false,
        message: "Tháng không hợp lệ",
      });
    }

    if (year && isNaN(parseInt(year as string))) {
      return res.status(400).json({
        success: false,
        message: "Năm không hợp lệ",
      });
    }

    const monthNum = month ? parseInt(month as string) : undefined;
    const yearNum = year ? parseInt(year as string) : undefined;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const serviceParams: any = {
      page: pageNum,
      limit: limitNum,
    };

    if (monthNum !== undefined) serviceParams.month = monthNum;
    if (yearNum !== undefined) serviceParams.year = yearNum;
    if (buildingId) serviceParams.buildingId = buildingId as string;
    if (roomId) serviceParams.roomId = roomId as string;
    if (status) serviceParams.status = status as string;

    const result = await getInvoices(serviceParams);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getInvoices:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getInvoiceByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "ID hóa đơn là bắt buộc",
      });
    }

    const invoice = await getInvoiceById(id);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error in getInvoiceById:", error);

    if (error.message === "ID hóa đơn không hợp lệ") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Không tìm thấy hóa đơn") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const deleteInvoiceController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "ID hóa đơn là bắt buộc",
      });
    }

    const invoice = await deleteInvoice(id);

    res.json({
      success: true,
      message: "Xóa hóa đơn thành công",
      data: invoice,
    });
  } catch (error: any) {
    console.error("Error in deleteInvoice:", error);

    if (error.message === "ID hóa đơn không hợp lệ") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Không tìm thấy hóa đơn") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
