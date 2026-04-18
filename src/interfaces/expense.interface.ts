export interface CreateExpenseInput {
  buildingId: string;
  title: string;
  description?: string;
  amount: number;
  expenseDate: Date;
}

export interface GetExpensesParams {
  buildingId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
