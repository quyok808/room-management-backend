import { Router } from "express";
import {
  confirmPaymentController,
  getRevenueByMonthController,
  getRevenueByBuildingController,
} from "../controllers/payment-transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

/**
 * @route POST /payments/confirm
 * @desc Xác nhận thanh toán hóa đơn
 * @access Private (Owner only)
 */
router.post(
  "/confirm",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  confirmPaymentController,
);

/**
 * @route GET /payments/revenue/month
 * @desc Lấy doanh thu theo tháng
 * @access Private (Owner only)
 */
router.get(
  "/revenue/month",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getRevenueByMonthController,
);

/**
 * @route GET /payments/revenue/building
 * @desc Lấy doanh thu theo tòa nhà
 * @access Private (Owner only)
 */
router.get(
  "/revenue/building",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getRevenueByBuildingController,
);

export default router;
