import Expense from "../models/Expense.model";
import { Types } from "mongoose";
import {
  CreateExpenseInput,
  GetExpensesParams,
} from "../interfaces/expense.interface";

export const createExpense = async (data: CreateExpenseInput) => {
  const expenseData = {
    buildingId: new Types.ObjectId(data.buildingId),
    electricityAmount: data.electricityAmount,
    waterAmount: data.waterAmount,
    houseAmount: data.houseAmount,
    livingFeeAmount: data.livingFeeAmount,
    otherFee: data.otherFee,
    expenseDate: data.expenseDate,
  };

  const expense = await Expense.create(expenseData);
  await expense.populate("buildingId", "name");
  return expense;
};

export const getExpenses = async (params?: GetExpensesParams) => {
  const { buildingId, startDate, endDate, page = 1, limit = 10 } = params || {};

  // Build query
  const query: any = {};

  if (buildingId) {
    query.buildingId = new Types.ObjectId(buildingId);
  }

  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) {
      query.expenseDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.expenseDate.$lte = new Date(endDate);
    }
  }

  // Pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(100, Math.max(1, limit));

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate("buildingId", "name")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limitNum),
    Expense.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    expenses,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getExpenseById = async (expenseId: string) => {
  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("ID chi phí không hợp lệ");
  }

  const expense = await Expense.findById(expenseId).populate(
    "buildingId",
    "name",
  );

  if (!expense) {
    throw new Error("Không tìm thấy chi phí");
  }

  return expense;
};

export const updateExpense = async (
  expenseId: string,
  data: Partial<CreateExpenseInput>,
) => {
  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("ID chi phí không hợp lệ");
  }

  const updateData: any = { ...data };

  if (data.buildingId) {
    updateData.buildingId = new Types.ObjectId(data.buildingId);
  }

  const expense = await Expense.findByIdAndUpdate(expenseId, updateData, {
    new: true,
  }).populate("buildingId", "name");

  if (!expense) {
    throw new Error("Không tìm thấy chi phí");
  }

  return expense;
};

export const deleteExpense = async (expenseId: string) => {
  if (!Types.ObjectId.isValid(expenseId)) {
    throw new Error("ID chi phí không hợp lệ");
  }

  const expense = await Expense.findByIdAndDelete(expenseId);

  if (!expense) {
    throw new Error("Không tìm thấy chi phí");
  }

  return expense;
};

export const getExpensesByBuilding = async (month?: number, year?: number) => {
  const matchStage: any = {};

  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    matchStage.expenseDate = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const expenses = await Expense.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "buildings",
        localField: "buildingId",
        foreignField: "_id",
        as: "building",
      },
    },
    { $unwind: "$building" },
    {
      $group: {
        _id: {
          buildingId: "$building._id",
          buildingName: "$building.name",
          month: { $month: "$expenseDate" },
          year: { $year: "$expenseDate" },
        },
        electricityAmount: { $sum: "$electricityAmount" },
        waterAmount: { $sum: "$waterAmount" },
        houseAmount: { $sum: "$houseAmount" },
        livingFeeAmount: { $sum: "$livingFeeAmount" },
        otherFee: { $sum: "$otherFee" },
        totalAmount: {
          $sum: {
            $add: [
              "$electricityAmount",
              "$waterAmount",
              "$houseAmount",
              "$livingFeeAmount",
              "$otherFee",
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: "$_id.buildingId",
        buildingId: "$_id.buildingId",
        buildingName: "$_id.buildingName",
        month: "$_id.month",
        year: "$_id.year",
        electricityAmount: "$electricityAmount",
        waterAmount: "$waterAmount",
        houseAmount: "$houseAmount",
        livingFeeAmount: "$livingFeeAmount",
        otherFee: "$otherFee",
        totalAmount: "$totalAmount",
        count: "$count",
      },
    },
    { $sort: { year: -1, month: -1, totalAmount: -1 } },
  ]);

  return expenses;
};
