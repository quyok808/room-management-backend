import { Router } from "express";
import {
  getInvoicePreviewController,
  bulkCreateInvoicesController,
  getInvoicesController,
  getInvoiceByIdController,
  deleteInvoiceController,
} from "../controllers/invoice.controller";

const router = Router();

// GET /invoice-preview - xem trước tiền
router.get("/invoice-preview", getInvoicePreviewController);

// POST /bulk-create - tạo nhiều hóa đơn cùng lúc
router.post("/bulk-create", bulkCreateInvoicesController);

// GET /invoices - lấy danh sách hóa đơn
router.get("/", getInvoicesController);

// GET /invoices/:id - lấy chi tiết hóa đơn
router.get("/:id", getInvoiceByIdController);

// DELETE /invoices/:id - xóa hóa đơn
router.delete("/:id", deleteInvoiceController);

export default router;
