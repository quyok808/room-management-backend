import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class CreateRoomDto {
  @IsString()
  number!: string;

  @IsNumber()
  area!: number;

  @IsNumber()
  price!: number;

  @IsNumber()
  electricityUnitPrice!: number;

  @IsOptional()
  @IsNumber()
  waterPricePerPerson?: number;

  @IsOptional()
  @IsNumber()
  waterPricePerCubicMeter?: number;

  @IsOptional()
  @IsNumber()
  parkingFee?: number;

  @IsOptional()
  @IsNumber()
  serviceFee?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBuildingDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  district!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  utilities?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  rooms!: CreateRoomDto[];
}

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  totalRooms?: number;

  @IsOptional()
  @IsNumber()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  utilities?: string[];

  // Default prices for rooms
  @IsOptional()
  @IsNumber()
  defaultRoomPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultElectricityUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultWaterUnitPrice?: number;

  @IsOptional()
  @IsNumber()
  defaultParkingFee?: number;

  @IsOptional()
  @IsNumber()
  defaultServiceFee?: number;

  @IsOptional()
  @IsNumber()
  area?: number;
}
