import { Router } from "express";
import {
  updateRoomController,
  // deleteRoomController,
  getAllRoomsController,
  getRoomByIdController,
  getOccupiedRoomsController,
  getRoomByUserIdController,
  getRoomsWithMeterReadingsController,
} from "../controllers/room.controller";
import { validateDto } from "../middlewares/validate.middleware";
import { UpdateRoomDto } from "../dtos/room.dto";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getAllRoomsController,
);

router.put(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  validateDto(UpdateRoomDto),
  updateRoomController,
);

// router.delete(
//   "/:id",
//   authMiddleware,
//   requireRole([ROLE.OWNER]),
//   deleteRoomController,
// );

router.get(
  "/occupied",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getOccupiedRoomsController,
);

router.get(
  "/meter-reading",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getRoomsWithMeterReadingsController,
);

router.get(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getRoomByIdController,
);

router.get(
  "/tenant/:userId",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getRoomByUserIdController,
);

export default router;
