import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateMeterReadingDto {
  @IsString()
  roomId!: string;

  @IsNumber()
  month!: number;

  @IsNumber()
  year!: number;

  @IsNumber()
  electricityReading!: number;

  @IsNumber()
  waterReading!: number;
}

export class UpdateMeterReadingDto {
  @IsOptional()
  @IsNumber()
  electricityReading?: number;

  @IsOptional()
  @IsNumber()
  waterReading?: number;
}
