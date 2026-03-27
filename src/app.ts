import "reflect-metadata";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import buildingRoutes from "./routes/building.route";
import roomRoutes from "./routes/room.route";
import tenantRoutes from "./routes/tenant.route";
import paymentRoutes from "./routes/payment.route";
import meterReadingRoutes from "./routes/meterReading.route";
import invoiceRoutes from "./routes/invoice.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("welcome");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/meter-readings", meterReadingRoutes);
app.use("/api/invoices", invoiceRoutes);

export default app;
