import Room from "../models/room.model";
import { Types } from "mongoose";
const archiver = require("archiver");
import puppeteer from "puppeteer-core";
const chromium = require("@sparticuz/chromium") as ChromiumType;
import { generatePaymentPDFContent } from "../templates/payment-receipt.template";

type ChromiumType = {
  args: string[];
  defaultViewport: any;
  executablePath: () => Promise<string>;
  headless: boolean;
};

export interface PaymentExportData {
  invoiceId: string;
  paymentId: string;
  tenantName: string;
  roomName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  rentAmount?: number;
  electricityCost?: number;
  waterCost?: number;
  internetFee?: number;
  parkingFee?: number;
  otherFee?: number;
  livingFee?: number;
  electricityPrevious?: number;
  electricityCurrent?: number;
  electricityUsage?: number;
  electricityUnitPrice?: number;
  waterPrevious?: number;
  waterCurrent?: number;
  waterUsage?: number;
  isWaterPricePerPerson?: boolean;
  memberCount?: number;
  vehicleCount?: number;
  waterUnitPrice?: number;
  month?: number;
  year?: number;
}

export const exportInvoicesAsZip = async (invoiceIds: string[]) => {
  try {
    const validInvoiceIds = invoiceIds.filter((id) =>
      Types.ObjectId.isValid(id),
    );
    if (validInvoiceIds.length === 0) {
      throw new Error("Không có invoice ID hợp lệ");
    }

    const Invoice = require("../models/invoice.model").default;
    const invoices = await Invoice.find({ _id: { $in: validInvoiceIds } })
      .populate({
        path: "roomId",
        populate: {
          path: "buildingId",
          select: "name",
        },
      })
      .lean();

    if (invoices.length === 0) {
      throw new Error(
        `Không tìm thấy invoices nào với IDs: ${validInvoiceIds.join(", ")}`,
      );
    }

    const exportData: PaymentExportData[] = [];

    for (const invoice of invoices) {
      const roomId = invoice.roomId;
      if (!roomId) continue;

      let tenantName = "Unknown";
      if (invoice.tenantId) {
        const room = await Room.findById(roomId._id).select("members").lean();
        if (room && room.members) {
          const tenant = room.members.find(
            (member: any) =>
              member._id.toString() === invoice.tenantId.toString(),
          );
          if (tenant) {
            tenantName = tenant.name;
          }
        }
      }

      const invoiceData: PaymentExportData = {
        invoiceId: invoice._id.toString(),
        paymentId: invoice._id.toString(),
        tenantName,
        roomName: `${roomId.buildingId?.name || "Unknown"} - ${roomId.number || "Unknown"}`,
        amount:
          (roomId.waterPricePerPerson > 0
            ? ((invoice as any).waterCost ?? 0) * roomId.members.length
            : ((invoice as any).waterCost ?? 0)) +
          ((invoice as any).rentAmount ?? 0) +
          ((invoice as any).electricityCost ?? 0) +
          ((invoice as any).internetFee ?? 0) +
          (((invoice as any).parkingFee ?? 0) *
            roomId?.members?.filter((member: any) =>
              member.licensePlate?.trim(),
            )?.length || 0) +
          ((invoice as any).otherFee ?? 0) +
          ((invoice as any).livingFee ?? 0),
        paymentDate: invoice.createdAt || new Date(),
        notes: invoice.notes,
        rentAmount: (invoice as any).rentAmount,
        electricityCost: (invoice as any).electricityCost,
        waterCost:
          roomId.waterPricePerPerson > 0
            ? ((invoice as any).waterCost ?? 0) * roomId.members.length
            : ((invoice as any).waterCost ?? 0),
        internetFee: (invoice as any).internetFee,
        parkingFee: (invoice as any).parkingFee,
        otherFee: (invoice as any).otherFee,
        livingFee: (invoice as any).livingFee,
        electricityPrevious: (invoice as any).electricityPrevious,
        electricityCurrent: (invoice as any).electricityCurrent,
        electricityUsage: (invoice as any).electricityUsage,
        electricityUnitPrice: (invoice as any).electricityUnitPrice,
        waterPrevious: (invoice as any).waterPrevious,
        waterCurrent: (invoice as any).waterCurrent,
        waterUsage: (invoice as any).waterUsage,
        memberCount: roomId.members.length,
        vehicleCount:
          roomId?.members?.filter((member: any) => member.licensePlate?.trim())
            ?.length || 0,
        waterUnitPrice:
          roomId.waterPricePerCubicMeter !== 0
            ? roomId.waterPricePerCubicMeter
            : (roomId.waterPricePerPerson ?? 0),
        isWaterPricePerPerson: roomId.waterPricePerPerson > 0,
        month:
          (invoice as any).month ||
          new Date(invoice.createdAt || new Date()).getMonth() + 1,
        year:
          (invoice as any).year ||
          new Date(invoice.createdAt || new Date()).getFullYear(),
      };

      exportData.push(invoiceData);
    }

    const exportBuffer = await createPaymentZip(exportData);

    return exportBuffer;
  } catch (error) {
    console.error("Error exporting invoices:", error);
    throw error;
  }
};

const createPaymentZip = async (
  payments: PaymentExportData[],
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver("zip", { zlib: { level: 9 } });
      const buffers: Buffer[] = [];

      archive.on("data", (data: Buffer) => {
        buffers.push(data);
      });

      archive.on("error", (err: Error) => {
        reject(err);
      });

      archive.on("end", () => {
        const zipBuffer = Buffer.concat(buffers);
        resolve(zipBuffer);
      });

      for (const payment of payments) {
        try {
          const pdfBuffer = await generatePaymentPDF(payment);
          const fileName = `${payment.roomName}_${payment.tenantName.replace(/[^\p{L}\p{N}]/gu, "_")}.pdf`;
          archive.append(pdfBuffer, { name: fileName });
        } catch (pdfError) {
          console.error(
            `Error generating PDF for payment ${payment.paymentId}:`,
            pdfError,
          );
        }
      }

      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
};

const generatePaymentPDF = async (
  payment: PaymentExportData,
): Promise<Buffer> => {
  const html = generatePaymentPDFContent(payment);
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfUint8Array = await page.pdf({ format: "A4" });
  await browser.close();
  return Buffer.from(pdfUint8Array);
};
