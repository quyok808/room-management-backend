import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";

const router = Router();

// GET /invoice-preview - xem trước tiền
router.get("/invoice-preview", InvoiceController.getInvoicePreview);

// POST /bulk-create - tạo nhiều hóa đơn cùng lúc
router.post("/bulk-create", InvoiceController.bulkCreateInvoices);

// GET /invoices - lấy danh sách hóa đơn
router.get("/", InvoiceController.getInvoices);

// GET /invoices/:id - lấy chi tiết hóa đơn
router.get("/:id", InvoiceController.getInvoiceById);

// DELETE /invoices/:id - xóa hóa đơn
router.delete("/:id", InvoiceController.deleteInvoice);

export default router;
