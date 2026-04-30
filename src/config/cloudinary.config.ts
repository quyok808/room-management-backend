import { v2 as cloudinary } from "cloudinary";
const CloudinaryStorage =
  require("multer-storage-cloudinary").CloudinaryStorage ||
  require("multer-storage-cloudinary");
import multer from "multer";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "users_cccd",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

export const uploadCloud = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});
