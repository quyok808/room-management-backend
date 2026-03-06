import { IsString, IsEmail, IsEnum, IsOptional, IsDateString } from "class-validator";
import { TenantStatus } from "../utils/app.constants";

export class CreateTenantDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  idNumber!: string;

  @IsString()
  roomId!: string;

  @IsDateString()
  moveInDate!: string;

  @IsDateString()
  contractEndDate!: string;

  @IsEnum(TenantStatus)
  status!: TenantStatus;

  @IsOptional()
  @IsString()
  emergencyContact?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  // User synchronization fields
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cccd?: string;
}
