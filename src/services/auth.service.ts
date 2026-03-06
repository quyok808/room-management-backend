import User from "../models/user.model";
import { signToken } from "../utils/jwt.util";
import { toUserResponse } from "../mappers/user.mapper";
import bcrypt from "bcryptjs";

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  return { 
    user: toUserResponse(user), 
    token 
  };
};

export const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  user.password = hashedNewPassword;
  await user.save();

  return { message: "Password changed successfully" };
};