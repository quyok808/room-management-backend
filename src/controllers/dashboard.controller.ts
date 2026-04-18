import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service";

export const getDashboardSummaryController = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    let monthNum, yearNum;
    
    if (month) {
      monthNum = parseInt(month as string);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: "Tháng không hợp lệ",
        });
      }
    }

    if (year) {
      yearNum = parseInt(year as string);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Năm không hợp lệ",
        });
      }
    }

    const dashboardData = await getDashboardSummary(monthNum, yearNum);

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error: any) {
    console.error("Error in getDashboardSummary:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
