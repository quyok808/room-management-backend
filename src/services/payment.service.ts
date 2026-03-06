import paymentModel, { IPayment, PaymentStatus } from "../models/payment.model";
import Room from "../models/room.model";
import { ROLE } from "../utils/app.constants";
import { Types } from "mongoose";

interface CreatePaymentInput {
  tenantId: string;
  roomId: string;
  month: string;
  electricityPrevious: number;
  electricityCurrent: number;
  waterPrevious: number;
  waterCurrent: number;
  otherFee?: number;
  dueDate: Date;
  status: string;
  notes?: string;
}

interface GetPaymentsParams {
  status?: string;
  month?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export const createPayment = async (data: CreatePaymentInput) => {
  // Fetch room details for pricing
  const room = await Room.findById(data.roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  // Calculate electricity and water amounts
  const electricityUsage = data.electricityCurrent - data.electricityPrevious;
  const electricityAmount = electricityUsage * room.electricityUnitPrice;
  const waterUsage = data.waterCurrent - data.waterPrevious;
  const waterAmount = waterUsage * room.waterUnitPrice;

  // Calculate total amount
  const totalAmount =
    electricityAmount +
    waterAmount +
    room.price +
    (room.internetFee || 0) +
    (room.parkingFee || 0) +
    (room.serviceFee || 0) +
    (data.otherFee || 0);

  const paymentData: any = {
    tenantId: new Types.ObjectId(data.tenantId),
    roomId: new Types.ObjectId(data.roomId),
    month: data.month,
    electricityPrevious: data.electricityPrevious,
    electricityCurrent: data.electricityCurrent,
    electricityAmount,
    waterPrevious: data.waterPrevious,
    waterCurrent: data.waterCurrent,
    waterAmount,
    otherFee: data.otherFee || 0,
    rentAmount: room.price,
    internetFeeAmount: room.internetFee || 0,
    parkingFeeAmount: room.parkingFee || 0,
    serviceFeeAmount: room.serviceFee || 0,
    amount: totalAmount,
    dueDate: data.dueDate,
    status: data.status,
  };

  if (data.notes) {
    paymentData.notes = data.notes;
  }

  const payment = await paymentModel.create(paymentData);

  return payment;
};

export const getPayments = async (
  params?: GetPaymentsParams,
  userRole?: number,
  userId?: string,
) => {
  const query: any = {};

  // Filter by user role
  if (userRole === ROLE.TENANT && userId) {
    query.tenantId = new Types.ObjectId(userId);
  } else if (params?.tenantId) {
    query.tenantId = new Types.ObjectId(params.tenantId);
  }

  // Filter by status
  if (params?.status) {
    query.status = params.status;
  }

  // Filter by month
  if (params?.month) {
    query.month = params.month;
  }

  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 10));
  const skip = (page - 1) * limit;

  const total = await paymentModel.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const payments = await paymentModel
    .find(query)
    .populate("roomId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    payments,
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

export const getPaymentById = async (
  paymentId: string,
  userRole?: number,
  userId?: string,
) => {
  const payment = await paymentModel.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Tenant can only view their own payments
  if (userRole === ROLE.TENANT && payment.tenantId.toString() !== userId) {
    throw new Error("Access denied");
  }

  return payment;
};

export const getPaymentByUserId = async (userId: string) => {
  return await paymentModel
    .find({ tenantId: userId })
    .populate({
      path: "roomId",
      select: "_id number floor buildingId",
      populate: {
        path: "buildingId",
        select: "_id name",
      },
    })
    .sort({ createdAt: -1 });
};

export const updatePayment = async (
  paymentId: string,
  data: Partial<IPayment>,
) => {
  const payment = await paymentModel.findByIdAndUpdate(paymentId, data, {
    new: true,
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};

export const markAsPaid = async (
  paymentId: string,
  userRole?: number,
  userId?: string,
) => {
  const payment = await paymentModel.findById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Tenant can only mark their own payments as paid
  if (userRole === ROLE.TENANT && payment.tenantId.toString() !== userId) {
    throw new Error("Access denied");
  }

  payment.status = PaymentStatus.PAID;
  payment.paidDate = new Date();
  await payment.save();

  return payment;
};

export const deletePayment = async (paymentId: string) => {
  const payment = await paymentModel.findByIdAndDelete(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};
