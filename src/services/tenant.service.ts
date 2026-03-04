import Tenant, { ITenant } from "../models/tenant.model";
import { CreateTenantDto } from "../dtos/tenant.dto";
import { TenantStatus } from "../utils/app.constants";
import Room from "../models/room.model";
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

export const getAllTenants = async (params?: GetAllTenantsParams, pagination?: PaginationParams) => {
  let query: any = {};

  // Filter by status if provided
  if (params?.status) {
    query.status = params.status;
  }

  // Filter by buildingId if provided (through rooms)
  if (params?.buildingId) {
    query.roomId = {
      $in: await Room.find({ buildingId: new Types.ObjectId(params.buildingId) }).distinct('_id')
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
      path: 'userId',
      select: 'name email phone cccdImages'
    })
    .populate({
      path: 'roomId',
      select: 'number floor buildingId',
      populate: {
        path: 'buildingId',
        select: 'name address'
      }
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
      hasPrev: page > 1
    }
  };
};

export const getTenantById = async (tenantId: string): Promise<any | null> => {
  const tenant = await Tenant.findById(tenantId)
    .populate({
      path: 'userId',
      select: 'name email phone cccdImages'
    })
    .populate({
      path: 'roomId',
      select: 'number floor buildingId',
      populate: {
        path: 'buildingId',
        select: 'name address'
      }
    });

  return tenant;
};
