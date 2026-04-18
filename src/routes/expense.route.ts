import { Router } from "express";
import {
  createExpenseController,
  getExpensesController,
  getExpenseByIdController,
  updateExpenseController,
  deleteExpenseController,
  getExpensesByBuildingController,
} from "../controllers/expense.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLE } from "../utils/app.constants";

const router = Router();

/**
 * @route POST /expenses
 * @desc Thêm chi phí mới
 * @access Private (Owner only)
 */
router.post(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  createExpenseController,
);

/**
 * @route GET /expenses
 * @desc Lấy danh sách chi phí
 * @access Private (Owner only)
 */
router.get(
  "/",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getExpensesController,
);

/**
 * @route GET /expenses/:id
 * @desc Lấy chi tiết chi phí
 * @access Private (Owner only)
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getExpenseByIdController,
);

/**
 * @route PUT /expenses/:id
 * @desc Cập nhật chi phí
 * @access Private (Owner only)
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  updateExpenseController,
);

/**
 * @route DELETE /expenses/:id
 * @desc Xóa chi phí
 * @access Private (Owner only)
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  deleteExpenseController,
);

/**
 * @route GET /expenses/by-building
 * @desc Lấy chi phí theo tòa nhà
 * @access Private (Owner only)
 */
router.get(
  "/by-building",
  authMiddleware,
  requireRole([ROLE.OWNER]),
  getExpensesByBuildingController,
);

export default router;
