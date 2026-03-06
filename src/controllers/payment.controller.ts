import { Request, Response } from "express";
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  markAsPaid,
  deletePayment,
  getPaymentByUserId,
} from "../services/payment.service";
import { ROLE } from "../utils/app.constants";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: number;
    email: string;
  };
}

// ===============================
// CREATE PAYMENT (OWNER)
// ===============================
export const createPaymentController = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot create payments",
      });
    }

    const payment = await createPayment(req.body);

    return res.status(201).json({
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to create payment",
    });
  }
};

// ===============================
// GET PAYMENTS
// OWNER → all
// TENANT → only theirs
// ===============================
export const getPaymentsController = async (req: Request, res: Response) => {
  try {
    const { status, month, tenantId, page, limit } = req.query;

    const params: any = {};
    if (status) params.status = status;
    if (month) params.month = month;
    if (tenantId) params.tenantId = tenantId;
    if (page) params.page = parseInt(page as string);
    if (limit) params.limit = parseInt(limit as string);

    const result = await getPayments(
      params,
      (req as any).user.role,
      (req as any).user.id,
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch payments",
    });
  }
};

// ===============================
// GET PAYMENT DETAIL
// ===============================
export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid payment id",
      });
    }

    const payment = await getPaymentById(
      id,
      (req as any).user.role,
      (req as any).user.id,
    );

    return res.status(200).json(payment);
  } catch (error: any) {
    return res.status(error.message === "Payment not found" ? 404 : 500).json({
      message: error.message || "Failed to fetch payment",
    });
  }
};

export const getPaymentByUserIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        message: "Invalid user id",
      });
    }

    const payment = await getPaymentByUserId(userId);

    return res.status(200).json(payment);
  } catch (error: any) {
    return res.status(error.message === "Payment not found" ? 404 : 500).json({
      message: error.message || "Failed to fetch payment",
    });
  }
};

// ===============================
// UPDATE PAYMENT (OWNER)
// ===============================
export const updatePaymentController = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot update payments",
      });
    }

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid payment id",
      });
    }

    const payment = await updatePayment(id, req.body);

    return res.status(200).json({
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error: any) {
    return res.status(error.message === "Payment not found" ? 404 : 400).json({
      message: error.message || "Update failed",
    });
  }
};

// ===============================
// TENANT PAY BILL
// ===============================
export const markAsPaidController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid payment id",
      });
    }

    const payment = await markAsPaid(
      id,
      (req as any).user.role,
      (req as any).user.id,
    );

    return res.status(200).json({
      message: "Payment successful",
      data: payment,
    });
  } catch (error: any) {
    return res.status(error.message === "Payment not found" ? 404 : 500).json({
      message: error.message || "Payment failed",
    });
  }
};

// ===============================
// DELETE PAYMENT (OWNER)
// ===============================
export const deletePaymentController = async (req: Request, res: Response) => {
  try {
    if ((req as any).user.role === ROLE.TENANT) {
      return res.status(403).json({
        message: "Tenants cannot delete payments",
      });
    }

    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid payment id",
      });
    }

    await deletePayment(id);

    return res.status(200).json({
      message: "Payment deleted successfully",
    });
  } catch (error: any) {
    return res.status(error.message === "Payment not found" ? 404 : 500).json({
      message: error.message || "Delete failed",
    });
  }
};
