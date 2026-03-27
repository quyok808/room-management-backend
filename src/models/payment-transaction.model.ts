import mongoose, { Schema, model, Types } from "mongoose";

export interface IPaymentTransaction extends mongoose.Document {
  invoiceId: Types.ObjectId;

  amount: number;

  paymentMethod?: string; // cash, bank, momo...

  paidAt: Date;

  note?: string;

  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },

    amount: { type: Number, required: true },

    paymentMethod: { type: String },

    paidAt: { type: Date, default: Date.now },

    note: { type: String },
  },
  { timestamps: true }
);

export default model<IPaymentTransaction>("PaymentTransaction", paymentTransactionSchema);
