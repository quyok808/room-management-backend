import { Request, Response } from "express";
import {
  updateRoom,
  // deleteRoom,
  // assignTenant,
  getAllRooms,
  getRoomById,
  getOccupiedRooms,
  getRoomByUserId,
  getRoomsWithMeterReadings,
} from "../services/room.service";
import { ROLE, ROOMSTATUS } from "../utils/app.constants";
import { PaginationUtil } from "../utils/pagination.util";

export const getAllRoomsController = async (req: Request, res: Response) => {
  try {
    const { number, buildingId, floor, status } = req.query;
    const searchParams: any = {};
    if (number) searchParams.number = number as string;
    if (buildingId) searchParams.buildingId = buildingId as string;
    if (floor) searchParams.floor = parseInt(floor as string);
    if (status) searchParams.status = status as ROOMSTATUS;

    const pagination = PaginationUtil.parsePaginationParams(req.query);
    const result = await getAllRooms(searchParams, pagination);

    return res.status(200).json({
      rooms: result.data,
      pagination: result.pagination,
    });
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

// export const deleteRoomController = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const currentUser = (req as any).user;

//     if (!id || typeof id !== "string") {
//       return res.status(400).json({
//         message: "Invalid room id",
//       });
//     }

//     if (currentUser.role === ROLE.TENANT) {
//       return res.status(403).json({
//         message: "Tenants cannot delete rooms",
//       });
//     }

//     const room = await deleteRoom(id, currentUser.id);

//     if (!room) {
//       return res.status(404).json({
//         message: "Room not found or you don't own the building",
//       });
//     }

//     return res.status(200).json({
//       message: "Room deleted successfully",
//       data: room,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       message: error.message,
//     });
//   }
// };

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

export const getRoomsWithMeterReadingsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = (req as any).user;
    const { month, year, buildingId, buildingName, roomNumber, page, limit } =
      req.query;

    if (currentUser.role !== ROLE.OWNER) {
      return res.status(403).json({
        message:
          "Chỉ chủ nhà mới có thể xem danh sách phòng với chỉ số điện nước",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        message: "Tháng và năm là bắt buộc",
      });
    }

    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        message: "Tháng không hợp lệ (1-12)",
      });
    }

    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({
        message: "Năm không hợp lệ (2020-2030)",
      });
    }

    // Build search params
    const searchParams: any = {};
    if (buildingId) searchParams.buildingId = buildingId as string;
    if (roomNumber) searchParams.roomNumber = roomNumber as string;
    if (buildingName) searchParams.buildingName = buildingName as string;

    // Build pagination
    const pagination: any = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getRoomsWithMeterReadings(
      monthNum,
      yearNum,
      searchParams,
      pagination,
    );

    return res.status(200).json({
      message: "Lấy danh sách phòng với chỉ số điện nước thành công",
      data: result.rooms,
      pagination: result.pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
