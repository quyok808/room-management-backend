import User, { IUser } from "../models/user.model";
import Tenant from "../models/tenant.model";
import bcrypt from "bcrypt";
import { ROLE } from "../utils/app.constants";
import { CreateUserInput } from "../interfaces/auth.interface";
import { PaginationUtil, PaginationParams } from "../utils/pagination.util";

export const UserService = async (data: CreateUserInput) => {
  const { email, password, phone, cccdFront, cccdBack } = data;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error("Email đã tồn tại");
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new Error("Số điện thoại đã tồn tại");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userData: any = {
    ...data,
    password: hashedPassword,
    role: data.role ?? ROLE.TENANT,
  };

  if (cccdFront && cccdBack) {
    userData.cccdImages = {
      front: {
        url: cccdFront.path,
        publicId: cccdFront.filename,
      },
      back: {
        url: cccdBack.path,
        publicId: cccdBack.filename,
      },
    };
  }

  const newUser = await User.create(userData);

  return newUser;
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User không tồn tại");
  }
  return user;
};

export const getAllUsers = async (
  searchParams?: {
    email?: string;
    name?: string;
    phone?: string;
  },
  paginationParams?: PaginationParams,
) => {
  const query = PaginationUtil.buildSearchQuery(searchParams || {}, [
    "email",
    "name",
    "phone",
  ]);

  const result = await PaginationUtil.paginate(User, query, paginationParams, {
    select: "-password",
  });

  return {
    users: result.data,
    pagination: result.pagination,
  };
};

export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User không tồn tại");
  }
  await User.findByIdAndDelete(userId);
  return { message: "User đã được xóa" };
};

export const updateUser = async (
  userId: string,
  updateData: Partial<CreateUserInput>,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User không tồn tại");
  }

  if (updateData.email && updateData.email !== user.email) {
    const existingEmail = await User.findOne({ email: updateData.email });
    if (existingEmail) {
      throw new Error("Email đã tồn tại");
    }
  }

  if (updateData.phone && updateData.phone !== user.phone) {
    const existingPhone = await User.findOne({ phone: updateData.phone });
    if (existingPhone) {
      throw new Error("Số điện thoại đã tồn tại");
    }
  }

  const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined),
  );

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: cleanUpdateData },
    {
      new: true,
    },
  );
  return updatedUser;
};

export const getNonTenantUsers = async (
  searchParams?: {
    email?: string;
    name?: string;
    phone?: string;
  },
  paginationParams?: PaginationParams,
) => {
  const activeTenantUserIds = await Tenant.distinct("userId", {
    status: "active",
  });

  let query: any = {
    _id: { $nin: activeTenantUserIds }, // Exclude users who have active tenant record
  };

  const searchQuery = PaginationUtil.buildSearchQuery(searchParams || {}, [
    "email",
    "name",
    "phone",
  ]);
  query = { ...query, ...searchQuery };

  const result = await PaginationUtil.paginate(User, query, paginationParams, {
    select: "-password",
  });

  return {
    users: result.data,
    pagination: result.pagination,
  };
};
