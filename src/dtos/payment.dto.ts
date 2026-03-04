import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from "class-validator";
import { PaymentStatus } from "../utils/app.constants";

export class CreatePaymentDto {
  @IsString()
  tenantId!: string;

  @IsString()
  roomId!: string;

  @IsNumber()
  electricityPrevious!: number;

  @IsNumber()
  electricityCurrent!: number;

  @IsNumber()
  waterPrevious!: number;

  @IsNumber()
  waterCurrent!: number;

  @IsOptional()
  @IsNumber()
  otherFee?: number;

  @IsString()
  month!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
