export interface InvoicePreviewItem {
  roomId: string;
  roomName: string;
  buildingName: string;
  electricityUsage?: number;
  electricityCost?: number;
  waterUsage?: number;
  waterCost?: number;
  rentAmount?: number;
  serviceFee?: number;
  internetFee?: number;
  parkingFee?: number;
  otherFee?: number;
  totalAmount?: number;
  canCreateInvoice: boolean;
  error?: string;
}
