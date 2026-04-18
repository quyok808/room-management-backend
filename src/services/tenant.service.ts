import Tenant, { ITenant } from "../models/tenant.model";
import { CreateTenantDto, UpdateTenantDto } from "../dtos/tenant.dto";
import { TenantStatus } from "../utils/app.constants";
import Room from "../models/room.model";
import User from "../models/user.model";
import { Types } from "mongoose";

export const createTenant = async (data: CreateTenantDto): Promise<ITenant> => {
  const tenant = await Tenant.create(data);
  return tenant;
};

interface GetAllTenantsParams {
  status?: TenantStatus;
  userId?: string;
  roomId?: string;
  buildingId?: string;
  page?: number;
  limit?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const getAllTenants = async (
  params?: GetAllTenantsParams,
  pagination?: PaginationParams,
) => {
  let query: any = {};

  // Filter by status if provided
  if (params?.status) {
    query.status = params.status;
  }

  // Filter by buildingId if provided (through rooms)
  if (params?.buildingId) {
    query.roomId = {
      $in: await Room.find({
        buildingId: new Types.ObjectId(params.buildingId),
      }).distinct("_id"),
    };
  }

  // Filter by userId
  if (params?.userId) {
    query.userId = params.userId;
  }

  // Filter by roomId
  if (params?.roomId) {
    query.roomId = params.roomId;
  }

  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(100, Math.max(1, pagination?.limit || 10));
  const skip = (page - 1) * limit;

  const total = await Tenant.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  const tenants = await Tenant.find(query)
    .populate({
      path: "userId",
      select: "name email phone cccd cccdImages",
    })
    .populate({
      path: "roomId",
      select: "number floor buildingId",
      populate: {
        path: "buildingId",
        select: "name address",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const getTenantById = async (tenantId: string): Promise<any | null> => {
  const tenant = await Tenant.findById(tenantId)
    .populate({
      path: "userId",
      select: "name email phone cccd cccdImages",
    })
    .populate({
      path: "roomId",
      select: "number floor buildingId",
      populate: {
        path: "buildingId",
        select: "name address",
      },
    });

  return tenant;
};

export const updateTenant = async (
  tenantId: string,
  updateData: UpdateTenantDto,
): Promise<any | null> => {
  // Find the tenant first
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Prepare tenant update data
  const tenantUpdateData: any = {};
  if (updateData.contractEndDate !== undefined) {
    tenantUpdateData.contractEndDate = updateData.contractEndDate;
  }
  if (updateData.status !== undefined) {
    tenantUpdateData.status = updateData.status;
  }
  if (updateData.emergencyContact !== undefined) {
    tenantUpdateData.emergencyContact = updateData.emergencyContact;
  }

  // Prepare user update data
  const userUpdateData: any = {};
  if (updateData.name !== undefined) {
    userUpdateData.name = updateData.name;
  }
  if (updateData.phone !== undefined) {
    userUpdateData.phone = updateData.phone;
  }
  if (updateData.cccd !== undefined) {
    userUpdateData.cccd = updateData.cccd;
  }

  // Update user if there are user fields to update
  if (Object.keys(userUpdateData).length > 0) {
    await User.findByIdAndUpdate(tenant.userId, userUpdateData);
  }

  // Update tenant
  const updatedTenant = await Tenant.findByIdAndUpdate(
    tenantId,
    tenantUpdateData,
    { new: true },
  )
    .populate({
      path: "userId",
      select: "name email phone cccd cccdImages",
    })
    .populate({
      path: "roomId",
      select: "number floor buildingId",
      populate: {
        path: "buildingId",
        select: "name address",
      },
    });

  return updatedTenant;
};
