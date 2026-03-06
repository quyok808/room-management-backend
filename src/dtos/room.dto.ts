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
  waterUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  internetFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceFee?: number;

  @IsOptional()
  @IsEnum(ROOMSTATUS)
  status?: ROOMSTATUS;

  @IsOptional()
  @IsString()
  currentTenant?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignTenantDto {
  @IsString()
  userId!: string;
}
