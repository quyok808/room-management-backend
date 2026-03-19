import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createMeterReadingController,
  getMeterReadingsController,
  getMeterReadingByIdController,
  updateMeterReadingController,
  deleteMeterReadingController,
  bulkUpsertMeterReadingsController,
} from "../controllers/meterReading.controller";

const router = express.Router();

// All meter reading routes require authentication
router.use(authMiddleware);

router.post("/", createMeterReadingController);
router.get("/", getMeterReadingsController);
router.get("/:id", getMeterReadingByIdController);
router.put("/:id", updateMeterReadingController);
router.delete("/:id", deleteMeterReadingController);

// POST /api/meter-readings/bulk - Bulk upsert meter readings
router.post("/bulk", bulkUpsertMeterReadingsController);

export default router;
