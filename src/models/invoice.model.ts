import { Schema, model, Document, Types } from "mongoose";

export enum InvoiceStatus {
  UNPAID = "unpaid",
  PAID = "paid",
  OVERDUE = "overdue",
}

export interface IInvoice extends Document {
  tenantId: Types.ObjectId;
  roomId: Types.ObjectId;

  month: number;
  year: number;

  // ===== ĐIỆN =====
  electricityPrevious: number;
  electricityCurrent: number;
  electricityUsage: number;
  electricityUnitPrice: number;
  electricityCost: number;

  // ===== NƯỚC =====
  waterPrevious: number;
  waterCurrent: number;
  waterUsage: number;
  waterUnitPrice: number;
  waterCost: number;

  // ===== PHÍ =====
  rentAmount: number;
  internetFee: number;
  parkingFee: number;
  serviceFee: number;
  otherFee: number;

  totalAmount: number;

  dueDate: Date;

  notes: string;

  status: InvoiceStatus;

  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    month: { type: Number, required: true },
    year: { type: Number, required: true },

    // điện
    electricityPrevious: { type: Number, required: true },
    electricityCurrent: { type: Number, required: true },
    electricityUsage: { type: Number, required: true },
    electricityUnitPrice: { type: Number, required: true },
    electricityCost: { type: Number, required: true },

    // nước
    waterPrevious: { type: Number, required: true },
    waterCurrent: { type: Number, required: true },
    waterUsage: { type: Number, required: true },
    waterUnitPrice: { type: Number, required: true },
    waterCost: { type: Number, required: true },

    // phí
    rentAmount: { type: Number, required: true },
    internetFee: { type: Number, default: 0 },
    parkingFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    otherFee: { type: Number, default: 0 },

    totalAmount: { type: Number, required: true },

    dueDate: { type: Date, required: true },

    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.UNPAID,
    },
  },
  { timestamps: true },
);

// ❗ tránh tạo trùng hóa đơn
invoiceSchema.index({ roomId: 1, month: 1, year: 1 }, { unique: true });

export default model<IInvoice>("Invoice", invoiceSchema);
