import { getRevenueByBuilding } from "./payment-transaction.service";
import { getExpensesByBuilding } from "./expense.service";

export const getDashboardSummary = async (month?: number, year?: number) => {
  // Get revenue and expenses data in parallel
  const [revenueData, expenseData] = await Promise.all([
    getRevenueByBuilding(month, year),
    getExpensesByBuilding(month, year),
  ]);

  // Calculate totals for the specified month/year
  const filteredRevenue = revenueData.filter(
    (r) =>
      (month === undefined || r.month === month) &&
      (year === undefined || r.year === year),
  );

  const filteredExpenses = expenseData.filter(
    (e) =>
      (month === undefined || e.month === month) &&
      (year === undefined || e.year === year),
  );

  // Calculate total revenue and expenses
  const totalRevenue = filteredRevenue.reduce(
    (sum, r) => sum + r.totalAmount,
    0,
  );
  const totalExpense = filteredExpenses.reduce(
    (sum, e) => sum + e.totalAmount,
    0,
  );
  const profit = totalRevenue - totalExpense;

  // Get current month/year if not provided
  const currentDate = new Date();
  const summaryMonth = month ?? currentDate.getMonth() + 1;
  const summaryYear = year ?? currentDate.getFullYear();

  // Format revenue by building for response
  const revenueByBuilding = filteredRevenue.map((r) => ({
    buildingId: r.buildingId,
    buildingName: r.buildingName,
    totalAmount: r.totalAmount,
    month: r.month,
    year: r.year,
  }));

  // Format expense by building for response
  const expenseByBuilding = filteredExpenses.map((e) => ({
    buildingId: e.buildingId,
    buildingName: e.buildingName,
    totalAmount: e.totalAmount,
    month: e.month,
    year: e.year,
  }));

  return {
    summary: {
      totalRevenue,
      totalExpense,
      profit,
      month: summaryMonth,
      year: summaryYear,
    },
    revenueByBuilding,
    expenseByBuilding,
  };
};
