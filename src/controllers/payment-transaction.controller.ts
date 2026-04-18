import { Request, Response } from "express";
import {
  confirmPayment,
  getRevenueByMonth,
  getRevenueByBuilding,
} from "../services/payment-transaction.service";
import { ConfirmPaymentInput } from "../interfaces/payment-transaction.interface";

export const confirmPaymentController = async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, paidAt, paymentMethod, note } = req.body;

    // Validate required fields
    if (!invoiceId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Thiếu các trường bắt buộc: invoiceId, amount",
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền phải là số dương",
      });
    }

    // Validate paidAt if provided
    let paidAtDate;
    if (paidAt) {
      paidAtDate = new Date(paidAt);
      if (isNaN(paidAtDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày thanh toán không hợp lệ",
        });
      }
    }

    const result = await confirmPayment({
      invoiceId,
      amount: parseFloat(amount),
      ...(paidAtDate && { paidAt: paidAtDate }),
      paymentMethod,
      note,
    });

    res.json({
      success: true,
      message: "Xác nhận thanh toán thành công",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in confirmPayment:", error);

    if (
      error.message === "ID hóa đơn không hợp lệ" ||
      error.message === "Không tìm thấy hóa đơn" ||
      error.message === "Số tiền thanh toán vượt quá số tiền hóa đơn"
    ) {
      return res.status(400).json({
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

export const getRevenueByMonthController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { month, year } = req.query;

    let monthNum, yearNum;
    if (month) {
      monthNum = parseInt(month as string);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Tháng không hợp lệ",
        });
      }
    }

    if (year) {
      yearNum = parseInt(year as string);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Năm không hợp lệ",
        });
      }
    }

    const revenue = await getRevenueByMonth(monthNum, yearNum);

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error: any) {
    console.error("Error in getRevenueByMonth:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getRevenueByBuildingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { month, year } = req.query;

    let monthNum, yearNum;
    if (month) {
      monthNum = parseInt(month as string);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Tháng không hợp lệ",
        });
      }
    }

    if (year) {
      yearNum = parseInt(year as string);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Năm không hợp lệ",
        });
      }
    }

    const revenue = await getRevenueByBuilding(monthNum, yearNum);

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error: any) {
    console.error("Error in getRevenueByBuilding:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
