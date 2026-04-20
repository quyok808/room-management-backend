export interface CreateExpenseInput {
  buildingId: string;
  electricityAmount: number;
  waterAmount: number;
  houseAmount: number;
  livingFeeAmount: number;
  otherFee: number;
  expenseDate: Date;
}

export interface GetExpensesParams {
  buildingId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
