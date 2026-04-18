import { Schema, model, Document, Types } from "mongoose";
import { ROOMSTATUS } from "../utils/app.constants";

// Sub-schema cho thành viên trong phòng
const memberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // Link tới User nếu có
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  licensePlate: { type: String, default: "" },
  cccdImages: {
    front: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    back: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },

  isRepresentative: { type: Boolean, default: false }, // Người chịu trách nhiệm chính
});

export interface IRoom extends Document {
  number: string;
  buildingId: Types.ObjectId;
  area: number;
  status: ROOMSTATUS;
  price: number;
  electricityUnitPrice: number;
  waterPricePerPerson: number;
  waterPricePerCubicMeter: number;
  parkingFee: number;
  livingFee: number;
  members: {
    _id: Types.ObjectId;
    userId?: Types.ObjectId | null;
    name: string;
    phone: string;
    licensePlate: string;
    cccdImages: {
      front: {
        url: string;
        publicId: string;
      };
      back: {
        url: string;
        publicId: string;
      };
    };
    isRepresentative: boolean;
  }[];
  description?: string;
  isDeleted: boolean;
}

const roomSchema = new Schema<IRoom>(
  {
    number: { type: String, required: true },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    area: { type: Number, required: true },
    status: {
      type: String,
      enum: [ROOMSTATUS.AVAILABLE, ROOMSTATUS.OCCUPIED, ROOMSTATUS.MAINTENANCE],
      default: ROOMSTATUS.AVAILABLE,
    },
    price: { type: Number, required: true },
    electricityUnitPrice: { type: Number, required: true },
    waterPricePerPerson: { type: Number, default: 0 },
    waterPricePerCubicMeter: { type: Number, default: 0 },
    parkingFee: { type: Number, default: 0 },
    livingFee: { type: Number, default: 0 },

    members: [memberSchema],

    description: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

roomSchema.index({ buildingId: 1, number: 1 });

export default model<IRoom>("Room", roomSchema);
