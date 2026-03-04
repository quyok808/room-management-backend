import { Router } from "express";
import {
  createPaymentController,
  deletePaymentController,
  getPaymentByIdController,
  getPaymentByUserIdController,
  getPaymentsController,
  markAsPaidController,
  updatePaymentController,
} from "../controllers/payment.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

/**
 * TENANT → xem hóa đơn của mình
 * OWNER → xem tất cả hóa đơn
 */
router.get(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getPaymentsController,
);

/**
 * OWNER tạo hóa đơn
 */
router.post(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  createPaymentController,
);

/**
 * Xem chi tiết hóa đơn
 * TENANT chỉ xem hóa đơn của mình
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getPaymentByIdController,
);

router.get(
  "/tenant/:userId",
  authMiddleware,
  requireRole([ROLE.OWNER, ROLE.TENANT]),
  getPaymentByUserIdController,
);

/**
 * OWNER cập nhật hóa đơn
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  updatePaymentController,
);

/**
 * TENANT thanh toán hóa đơn
 */
router.patch(
  "/:id/pay",
  authMiddleware,
  requireRole([ROLE.TENANT]),
  markAsPaidController,
);

/**
 * OWNER xóa hóa đơn
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  deletePaymentController,
);

export default router;
