import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkMeterReadingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMeterReadingItemDto)
  meterReadings!: BulkMeterReadingItemDto[];
}

export class BulkMeterReadingItemDto {
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
