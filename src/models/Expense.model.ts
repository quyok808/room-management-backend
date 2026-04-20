import { Schema, model, Document, Types } from "mongoose";

export interface IExpense extends Document {
  buildingId: Types.ObjectId;
  electricityAmount: number;
  waterAmount: number;
  houseAmount: number;
  livingFeeAmount: number;
  otherFee: number;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true,
    },
    electricityAmount: { type: Number, required: true, min: 0 },
    waterAmount: { type: Number, required: true, min: 0 },
    houseAmount: { type: Number, required: true, min: 0 },
    livingFeeAmount: { type: Number, required: true, min: 0 },
    otherFee: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export default model<IExpense>("Expense", expenseSchema);
