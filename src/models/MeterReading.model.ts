import { Schema, model, Document, Types } from "mongoose";

export interface IMeterReading extends Document {
  roomId: Types.ObjectId;
  month: number;
  year: number;

  electricityReading: number;

  waterReading: number;

  createdAt: Date;
  updatedAt: Date;
}

const meterReadingSchema = new Schema<IMeterReading>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020, max: 2030 },

    electricityReading: { type: Number, required: true, min: 0 },

    waterReading: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default model<IMeterReading>("MeterReading", meterReadingSchema);