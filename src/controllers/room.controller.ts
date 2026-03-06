import { Request, Response } from "express";
import {
  updateRoom,
  deleteRoom,
  assignTenant,
  removeTenant,
  getAllRooms,
  getRoomById,
  getOccupiedRooms,
  getRoomByUserId,
} from "../services/room.service";
import { ROLE } from "../utils/app.constants";
import { getBuildingById } from "../services/building.service";

export const getAllRoomsController = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { number, buildingId, floor, status, page, limit } = req.query;

    // Build search params
    const searchParams: any = {};
    if (number) searchParams.number = number as string;
    if (buildingId) searchParams.buildingId = buildingId as string;
    if (floor) searchParams.floor = parseInt(floor as string);
    if (status) searchParams.status = status as string;

    // Build pagination
    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getAllRooms(searchParams, pagination);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const updateRoomController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid room id",
      });
    }

    if (currentUser.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot update rooms",
      });
    }

    const room = await updateRoom(id, req.body, currentUser.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found or you don't own the building",
      });
    }

    return res.status(200).json({
      message: "Room updated successfully",
      data: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteRoomController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid room id",
      });
    }

    if (currentUser.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot delete rooms",
      });
    }

    const room = await deleteRoom(id, currentUser.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found or you don't own the building",
      });
    }

    return res.status(200).json({
      message: "Room deleted successfully",
      data: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const assignTenantController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid room id",
      });
    }

    if (currentUser.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot assign tenants to rooms",
      });
    }

    const room = await assignTenant(id, req.body.userId, currentUser.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found or you don't own the building",
      });
    }

    return res.status(200).json({
      message: "Tenant assigned to room successfully",
      data: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const removeTenantController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid room id",
      });
    }

    if (currentUser.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot remove tenants from rooms",
      });
    }

    const room = await removeTenant(id, currentUser.id);

    if (!room) {
      return res.status(404).json({
        message: "Room not found or you don't own the building",
      });
    }

    return res.status(200).json({
      message: "Tenant removed from room successfully",
      data: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getRoomByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await getRoomById(id as string);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json({
      message: "Room retrieved successfully",
      room: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getOccupiedRoomsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = (req as any).user;
    const { buildingId, floor, page, limit } = req.query;

    // Build search params
    const searchParams: any = {};
    if (buildingId) searchParams.buildingId = buildingId as string;
    if (floor) searchParams.floor = parseInt(floor as string);

    // Build pagination
    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getOccupiedRooms(searchParams, pagination);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getRoomByUserIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;
    const room = await getRoomByUserId(userId as string);

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    return res.status(200).json({
      message: "Room retrieved successfully",
      room: room,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
