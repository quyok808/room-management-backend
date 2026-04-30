import { Router } from "express";
import { exportPaymentsController } from "../controllers/payment-export.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

// POST /payments/export-zip - export payments as ZIP file
router.post(
  "/export-zip",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  exportPaymentsController,
);

export default router;
