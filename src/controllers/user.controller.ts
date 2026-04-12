import { Request, Response } from "express";
import {
  UserService,
  getUserById,
  getAllUsers,
  deleteUser,
  updateUser,
  getNonTenantUsers,
} from "../services/user.service";
import { ROLE } from "../utils/app.constants";
import { PaginationUtil } from "../utils/pagination.util";

export const createUser = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const frontFile = files?.cccdFront?.[0];
    const backFile = files?.cccdBack?.[0];

    // CCCD images are optional when creating user
    // User can update them later

    const newUser = await UserService({
      ...req.body,
      password: req.body.phone as string,
      cccdFront: frontFile,
      cccdBack: backFile,
    });

    const { password, ...userResponse } = newUser.toObject();

    return res.status(201).json({
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    if (currentUser.role === ROLE.TENANT && currentUser.id !== id) {
      return res.status(403).json({
        message: "You can only view your own profile",
      });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { password, ...userResponse } = user.toObject();

    return res.status(200).json({
      message: "User retrieved successfully",
      data: userResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const { email, name, phone } = req.query;

    const searchParams: {
      email?: string;
      name?: string;
      phone?: string;
    } = {};

    if (typeof email === "string") {
      searchParams.email = email;
    }

    if (typeof name === "string") {
      searchParams.name = name;
    }

    if (typeof phone === "string") {
      searchParams.phone = phone;
    }

    const paginationParams = PaginationUtil.parsePaginationParams(req.query);

    const result = await getAllUsers(searchParams, paginationParams);

    return res.status(200).json({
      message: "Users retrieved successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message: "Only owners can delete users",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const result = await deleteUser(id);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Owners can update any user, tenants can only update themselves
    if (currentUser.role === ROLE.TENANT && currentUser.id !== id) {
      return res.status(403).json({
        message: "You can only update your own profile",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    // Handle file uploads for cccdImages if provided
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const cccdImages: any = {};
    const frontFile = files?.cccdFront?.[0];
    const backFile = files?.cccdBack?.[0];

    const updateData: any = { ...req.body };

    if (frontFile) {
      updateData["cccdImages.front"] = {
        url: frontFile.path,
        publicId: frontFile.filename,
      };
    }

    if (backFile) {
      updateData["cccdImages.back"] = {
        url: backFile.path,
        publicId: backFile.filename,
      };
    }

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { password, ...userResponse } = updatedUser.toObject();

    return res.status(200).json({
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getNonTenantUsersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, name, phone } = req.query;

    const searchParams: {
      email?: string;
      name?: string;
      phone?: string;
    } = {};

    if (typeof email === "string") {
      searchParams.email = email;
    }

    if (typeof name === "string") {
      searchParams.name = name;
    }

    if (typeof phone === "string") {
      searchParams.phone = phone;
    }

    const paginationParams = PaginationUtil.parsePaginationParams(req.query);

    const result = await getNonTenantUsers(searchParams, paginationParams);

    return res.status(200).json({
      message: "Non-tenant users retrieved successfully",
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
