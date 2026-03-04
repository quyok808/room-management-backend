import { Request, Response } from "express";
import { getAllTenants, getTenantById } from "../services/tenant.service";
import { TenantStatus } from "../utils/app.constants";

export const getAllTenantsController = async (req: Request, res: Response) => {
  try {
    const { status, userId, roomId, page, limit } = req.query;

    const params: any = {};

    // Parse status filter
    if (typeof status === "string") {
      if (status === "active") {
        params.status = TenantStatus.ACTIVE;
      } else if (status === "inactive") {
        params.status = TenantStatus.INACTIVE;
      }
    }

    // Parse userId filter
    if (typeof userId === "string") {
      params.userId = userId;
    }

    // Parse roomId filter
    if (typeof roomId === "string") {
      params.roomId = roomId;
    }

    // Parse pagination
    if (typeof page === "string") {
      params.page = parseInt(page, 10);
    }

    if (typeof limit === "string") {
      params.limit = parseInt(limit, 10);
    }

    const result = await getAllTenants(params);

    return res.status(200).json({
      message: "Tenants retrieved successfully",
      data: result.tenants,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getTenantByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid tenant id",
      });
    }

    const tenant = await getTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      message: "Tenant retrieved successfully",
      data: tenant,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
