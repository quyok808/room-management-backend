import PaymentTransaction, {
  IPaymentTransaction,
} from "../models/payment-transaction.model";
import Invoice, { InvoiceStatus } from "../models/invoice.model";
import { Types } from "mongoose";
import { ConfirmPaymentInput } from "../interfaces/payment-transaction.interface";

export const confirmPayment = async (data: ConfirmPaymentInput) => {
  const { invoiceId, amount, paidAt = new Date(), paymentMethod, note } = data;

  // B1: Lấy Invoice
  if (!Types.ObjectId.isValid(invoiceId)) {
    throw new Error("ID hóa đơn không hợp lệ");
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error("Không tìm thấy hóa đơn");
  }

  // B2: Tính đã trả bao nhiêu (dùng aggregate cho performance)
  const paidResult = await PaymentTransaction.aggregate([
    {
      $match: {
        invoiceId: new Types.ObjectId(invoiceId),
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$amount" },
      },
    },
  ]);

  const totalPaid = paidResult[0]?.totalPaid || 0;
  const newTotalPaid = totalPaid + amount;

  // B3: Validate
  if (newTotalPaid > invoice.totalAmount) {
    throw new Error("Số tiền thanh toán vượt quá số tiền hóa đơn");
  }

  // B4: Tạo PaymentTransaction
  const paymentData: Partial<IPaymentTransaction> = {
    invoiceId: new Types.ObjectId(invoiceId),
    amount,
    paidAt,
  };

  if (paymentMethod) paymentData.paymentMethod = paymentMethod;
  if (note) paymentData.note = note;

  const payment = await PaymentTransaction.create(paymentData);

  // B5: Update trạng thái Invoice (fix logic)
  if (newTotalPaid >= invoice.totalAmount) {
    invoice.status = InvoiceStatus.PAID;
  } else if (newTotalPaid > 0) {
    invoice.status = InvoiceStatus.PARTIAL; // Trả 1 phần
  } else {
    invoice.status = InvoiceStatus.UNPAID; // Chưa trả gì
  }

  await invoice.save();

  // Populate thông tin cho response
  await payment.populate({
    path: "invoiceId",
    populate: {
      path: "roomId",
      populate: {
        path: "buildingId",
        select: "name",
      },
    },
  });

  return {
    payment,
    invoice,
    totalPaid: newTotalPaid,
    remainingAmount: invoice.totalAmount - newTotalPaid,
  };
};

export const getRevenueByMonth = async (month?: number, year?: number) => {
  const matchStage: any = {};

  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    matchStage.paidAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const revenue = await PaymentTransaction.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          month: { $month: "$paidAt" },
          year: { $year: "$paidAt" },
        },
        month: { $first: { $month: "$paidAt" } },
        year: { $first: { $year: "$paidAt" } },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);

  return revenue;
};

export const getRevenueByBuilding = async (month?: number, year?: number) => {
  const matchStage: any = {};

  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    matchStage.paidAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  const revenue = await PaymentTransaction.aggregate([
    { $match: matchStage },
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
      $lookup: {
        from: "rooms",
        localField: "invoice.roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },
    {
      $lookup: {
        from: "buildings",
        localField: "room.buildingId",
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
          month: { $month: "$paidAt" },
          year: { $year: "$paidAt" },
        },
        totalAmount: { $sum: "$amount" },
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
        totalAmount: "$totalAmount",
        count: "$count",
      },
    },
    { $sort: { year: -1, month: -1, totalAmount: -1 } },
  ]);

  return revenue;
};
