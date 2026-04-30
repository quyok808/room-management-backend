import { Request, Response } from "express";
import { exportInvoicesAsZip } from "../services/payment-export.service";

export const exportPaymentsController = async (req: Request, res: Response) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách invoice IDs là bắt buộc",
      });
    }

    const zipBuffer = await exportInvoicesAsZip(invoiceIds);

    const fileName = `payments_export_${new Date().toISOString().split("T")[0]}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", zipBuffer.length);

    res.send(zipBuffer);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Lỗi khi export payments",
    });
  }
};
