import { IsString, IsNumber, IsEnum, IsOptional, Min } from "class-validator";
import { ROOMSTATUS } from "../utils/app.constants";

export class CreateRoomDto {
  @IsString()
  number!: string;

  @IsString()
  buildingId!: string;

  @IsNumber()
  floor!: number;

  @IsNumber()
  @Min(1)
  area!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(ROOMSTATUS)
  status?: ROOMSTATUS;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  buildingId?: string;

  @IsOptional()
  @IsNumber()
  floor?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  electricityUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waterPricePerPerson?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waterPricePerCubicMeter?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  livingFee?: number;

  @IsOptional()
  @IsEnum(ROOMSTATUS)
  status?: ROOMSTATUS;

  @IsOptional()
  members?: MemberUpdateDto[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class MemberUpdateDto {
  @IsOptional()
  _id?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  cccdImages?: {
    front: {
      url?: string; // Base64 string hoặc URL từ Cloudinary (backend sẽ tự upload nếu là base64)
      publicId?: string; // Không cần gửi, backend sẽ tự động xử lý
    };
    back: {
      url?: string; // Base64 string hoặc URL từ Cloudinary (backend sẽ tự upload nếu là base64)
      publicId?: string; // Không cần gửi, backend sẽ tự động xử lý
    };
  };

  @IsOptional()
  isRepresentative?: boolean;
}
