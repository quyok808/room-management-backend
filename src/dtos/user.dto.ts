import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { ROLE } from "../utils/app.constants";

export class CreateUserDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  // Thêm password nếu cần (hoặc dùng phone làm password như logic cũ của bạn)
  //   @IsString()
  //   @IsNotEmpty()
  //   @Length(6, 50, { message: "Password phải từ 6 ký tự" })
  //   password!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{9,11}$/, { message: "Số điện thoại phải từ 9-11 số" })
  phone!: string;

  @IsOptional()
  @Type(() => Number) // Quan trọng: Convert string '1' -> number 1
  @IsEnum(ROLE)
  role?: ROLE;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{1,10}$/, { message: "Biển số xe không hợp lệ" })
  licensePlate?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9,11}$/, { message: "Số điện thoại phải từ 9-11 số" })
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(ROLE)
  role?: ROLE;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{1,10}$/, { message: "Biển số xe không hợp lệ" })
  licensePlate?: string;
}
