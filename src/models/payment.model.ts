import mongoose, { Schema, model, Types } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  OVERDUE = "overdue",
}

export interface IPayment extends mongoose.Document {
  tenantId: Types.ObjectId;
  roomId: Types.ObjectId;

  month: string;

  electricityPrevious: number;
  electricityCurrent: number;
  electricityAmount: number;

  waterPrevious: number;
  waterCurrent: number;
  waterAmount: number;

  otherFee?: number;

  rentAmount: number;
  internetFeeAmount: number;
  parkingFeeAmount: number;
  serviceFeeAmount: number;

  amount: number;

  dueDate: Date;
  paidDate?: Date;

  status: PaymentStatus;
  notes?: string;
}

const paymentSchema = new Schema<IPayment>(
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

    month: { type: String, required: true },

    electricityPrevious: { type: Number, required: true },
    electricityCurrent: { type: Number, required: true },
    electricityAmount: { type: Number, required: true },

    waterPrevious: { type: Number, required: true },
    waterCurrent: { type: Number, required: true },
    waterAmount: { type: Number, required: true },

    otherFee: { type: Number, default: 0 },

    rentAmount: { type: Number, required: true },
    internetFeeAmount: { type: Number, default: 0 },
    parkingFeeAmount: { type: Number, default: 0 },
    serviceFeeAmount: { type: Number, default: 0 },

    amount: { type: Number, required: true },

    dueDate: { type: Date, required: true },
    paidDate: { type: Date },

    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },

    notes: { type: String },
  },
  { timestamps: true }
);

export default model<IPayment>("Payment", paymentSchema);
