import { Router } from "express";
import {
  createUser,
  getUser,
  getAllUsersController,
  deleteUserController,
  updateUserController,
  getNonTenantUsersController,
} from "../controllers/user.controller";
import { uploadCloud } from "../config/cloudinary.config";
import { validateDto } from "../middlewares/validate.middleware";
import { CreateUserDto, UpdateUserDto } from "../dtos/user.dto";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

const uploadFields = uploadCloud.fields([
  { name: "cccdFront", maxCount: 1 },
  { name: "cccdBack", maxCount: 1 },
]);

router.post(
  "/create",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  uploadFields,
  validateDto(CreateUserDto),
  createUser,
);

router.get(
  "/non-tenants",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getNonTenantUsersController,
);

router.get(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getAllUsersController,
);

router.get(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getUser,
);

router.put(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  uploadFields,
  validateDto(UpdateUserDto),
  updateUserController,
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  deleteUserController,
);

export default router;
