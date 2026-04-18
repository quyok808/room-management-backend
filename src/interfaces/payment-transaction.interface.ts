export interface ConfirmPaymentInput {
  invoiceId: string;
  amount: number;
  paidAt?: Date;
  paymentMethod?: string;
  note?: string;
}

export interface GetRevenueParams {
  month?: number;
  year?: number;
}
