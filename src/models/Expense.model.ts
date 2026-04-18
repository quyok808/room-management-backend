import { Schema, model, Document, Types } from "mongoose";

export interface IExpense extends Document {
  buildingId: Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
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
    title: { type: String, required: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export default model<IExpense>("Expense", expenseSchema);
