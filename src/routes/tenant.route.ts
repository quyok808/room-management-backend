import { Router } from "express";
import { getAllTenantsController, getTenantByIdController } from "../controllers/tenant.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

router.get("/", authMiddleware, requireRole([ROLE.OWNER]), getAllTenantsController);

router.get("/:id", authMiddleware, requireRole([ROLE.OWNER]), getTenantByIdController);

export default router;
