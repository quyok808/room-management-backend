import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByBuilding,
} from "../services/expense.service";
import { CreateExpenseInput } from "../interfaces/expense.interface";

export const createExpenseController = async (req: Request, res: Response) => {
  try {
    const { buildingId, title, description, amount, expenseDate } = req.body;

    // Validate required fields
    if (!buildingId || !title || !amount || !expenseDate) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu các trường bắt buộc: buildingId, title, amount, expenseDate",
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền phải là số dương",
      });
    }

    // Validate expenseDate
    const expenseDateObj = new Date(expenseDate);
    if (isNaN(expenseDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày chi phí không hợp lệ",
      });
    }

    const expense = await createExpense({
      buildingId,
      title,
      description,
      amount: parseFloat(amount),
      expenseDate: expenseDateObj,
    });

    res.status(201).json({
      success: true,
      message: "Thêm chi phí thành công",
      data: expense,
    });
  } catch (error: any) {
    console.error("Error in createExpense:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getExpensesController = async (req: Request, res: Response) => {
  try {
    const { buildingId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Validate pagination params
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Page phải là số nguyên dương",
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit phải là số nguyên từ 1 đến 100",
      });
    }

    const result = await getExpenses({
      buildingId: buildingId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in getExpenses:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getExpenseByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "ID chi phí là bắt buộc",
      });
    }

    const expense = await getExpenseById(id);

    res.json({
      success: true,
      data: expense,
    });
  } catch (error: any) {
    console.error("Error in getExpenseById:", error);

    if (error.message === "ID chi phí không hợp lệ") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Không tìm thấy chi phí") {
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

export const updateExpenseController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { buildingId, title, description, amount, expenseDate } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "ID chi phí là bắt buộc",
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Số tiền phải là số dương",
      });
    }

    // Validate expenseDate if provided
    if (expenseDate) {
      const expenseDateObj = new Date(expenseDate);
      if (isNaN(expenseDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày chi phí không hợp lệ",
        });
      }
    }

    const updateData: any = {
      buildingId: buildingId ? new Types.ObjectId(buildingId) : undefined,
      title,
      description,
      amount: amount ? parseFloat(amount) : undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
    };

    const expense = await updateExpense(id, updateData);

    res.json({
      success: true,
      message: "Cập nhật chi phí thành công",
      data: expense,
    });
  } catch (error: any) {
    console.error("Error in updateExpense:", error);

    if (error.message === "ID chi phí không hợp lệ") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Không tìm thấy chi phí") {
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

export const deleteExpenseController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "ID chi phí là bắt buộc",
      });
    }

    const expense = await deleteExpense(id);

    res.json({
      success: true,
      message: "Xóa chi phí thành công",
      data: expense,
    });
  } catch (error: any) {
    console.error("Error in deleteExpense:", error);

    if (error.message === "ID chi phí không hợp lệ") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Không tìm thấy chi phí") {
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

export const getExpensesByBuildingController = async (
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

    const expenses = await getExpensesByBuilding(monthNum, yearNum);

    res.json({
      success: true,
      data: expenses,
    });
  } catch (error: any) {
    console.error("Error in getExpensesByBuilding:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
