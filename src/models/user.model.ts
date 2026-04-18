import { Schema, model, Document } from "mongoose";
import { ROLE } from "../utils/app.constants";

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: ROLE;
  phone?: string;
  licensePlate: string;
  cccdImages?: {
    front: { url: string; publicId: string };
    back: { url: string; publicId: string };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: Number,
      enum: [ROLE.TENANT, ROLE.OWNER],
      default: ROLE.TENANT,
    },
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
  },
  { timestamps: true },
);

export default model<IUser>("User", userSchema);
