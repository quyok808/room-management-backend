import { Schema, model, Document, Types } from "mongoose";

export interface IBuilding extends Document {
  name: string;
  address: string;
  district: string;
  city: string;
  totalFloors: number;
  totalRooms: number;
  yearBuilt?: number;
  ownerId: Types.ObjectId; 
  description?: string;
  utilities?: string[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const buildingSchema = new Schema<IBuilding>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    totalFloors: { type: Number, required: true },
    totalRooms: { type: Number, required: true },
    yearBuilt: { type: Number, required: false },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, default: "" },
    utilities: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IBuilding>("Building", buildingSchema);