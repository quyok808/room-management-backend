import { PaymentExportData } from "../services/payment-export.service";
import * as fs from "fs";
import * as path from "path";

const getLogoBase64 = () => {
  const filePath = path.resolve(process.cwd(), "src/templates/logo-base64.txt");
  const base64 = fs.readFileSync(filePath, "utf-8");

  return `data:image/png;base64,${base64}`;
};
export const generatePaymentPDFContent = (
  payment: PaymentExportData,
): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const logoBase64 = getLogoBase64();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${payment.paymentId}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      color: #1e293b;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      color: rgba(0,0,0,0.08);
      z-index: -1;
      font-weight: bold;
      pointer-events: none;
    }
    @media print {
      .watermark { color: rgba(0,0,0,0.05); }
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="watermark">ĐÃ THANH TOÁN</div>
  
  <div class="space-y-6 md:p-8">
    <!-- Invoice Card -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <!-- Company Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-2 pb-2 border-b border-slate-200">
        <div>
  <img 
      src="${logoBase64}" 
    alt="QLNT Logo" 
    class="h-12 mb-2"
  />
  <p class="text-slate-600 mt-2">Website quản lý nhà trọ</p>
  <p class="text-slate-600 text-sm">Điện thoại: 0901234567</p>
  <p class="text-slate-600 text-sm">Email: info@gmail.com</p>
</div>

        <!-- Invoice Info -->
        <div class="text-right">
          <h2 class="text-2xl font-bold text-slate-900 mb-4 text-center">
            ${payment.roomName}
          </h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600 text-left">Số hóa đơn:</span>
              <span class="font-bold text-slate-900">${payment.invoiceId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Ngày lập hóa đơn:</span>
              <span class="font-semibold text-slate-900">${new Date(payment.paymentDate).toLocaleDateString("vi-VN")}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Người thuê:</span>
              <span class="font-semibold text-slate-900">${payment.tenantName}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div class="mb-2 hidden md:block">
        <table class="w-full">
          <thead>
            <tr class="border-b-2 border-slate-900">
              <th class="text-left py-3 px-4 font-semibold text-slate-900">Mô tả</th>
              <th class="text-right py-3 px-4 font-semibold text-slate-900">Đơn giá</th>
              <th class="text-right py-3 px-4 font-semibold text-slate-900">Số lượng</th>
              <th class="text-right py-3 px-4 font-semibold text-slate-900">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <!-- Tiền phòng -->
            ${
              payment.rentAmount
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">
                  Tiền thuê phòng ${payment.month}/${payment.year}
                </p>
                <p class="text-sm text-slate-600">
                  ${payment.roomName}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.rentAmount)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">1</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.rentAmount)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Điện -->
            ${
              payment.electricityCost && payment.electricityCost > 0
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">Tiền điện</p>
                <p class="text-sm text-slate-600">
                  CSĐ cũ: ${payment.electricityPrevious || 0} | CSĐ mới: ${payment.electricityCurrent || 0} | Sử dụng: ${payment.electricityUsage || 0} kWh
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.electricityUnitPrice || 0)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">${payment.electricityUsage || 0} kWh</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.electricityCost)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Nước -->
            ${
              payment.waterCost && payment.waterCost > 0
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">Tiền nước</p>
                <p class="text-sm text-slate-600">
                  ${
                    payment.isWaterPricePerPerson === false
                      ? `CSĐ cũ: ${payment.waterPrevious || 0} | CSĐ mới: ${payment.waterCurrent || 0} | Sử dụng: ${payment.waterUsage} m³`
                      : `Tính theo người: ${formatCurrency(payment.waterUnitPrice || 0)}/người`
                  }
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.waterUnitPrice || 0)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${
                    payment.isWaterPricePerPerson === false
                      ? `${payment.waterUsage} m³`
                      : `${payment.memberCount ?? 0} người`
                  }
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.waterCost)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Gửi xe -->
            ${
              payment.parkingFee && payment.parkingFee > 0
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">Tiền gửi xe</p>
                <p class="text-sm text-slate-600">Phí gửi xe hàng tháng</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.parkingFee)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">${payment.vehicleCount}</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.parkingFee)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Phí sinh hoạt -->
            ${
              payment.livingFee && payment.livingFee > 0
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">Phí sinh hoạt</p>
                <p class="text-sm text-slate-600">Phí sinh hoạt hàng tháng</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.livingFee)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">1</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.livingFee)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Phí khác -->
            ${
              payment.otherFee && payment.otherFee > 0
                ? `
            <tr class="border-b border-slate-200">
              <td class="py-4 px-4">
                <p class="font-medium text-slate-900">Phí khác</p>
                <p class="text-sm text-slate-600">Các khoản phí khác</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">
                  ${formatCurrency(payment.otherFee)}
                </p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-medium text-slate-900">1</p>
              </td>
              <td class="text-right py-4 px-4">
                <p class="font-semibold text-slate-900">
                  ${formatCurrency(payment.otherFee)}
                </p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Total -->
            <tr class="border-b-2 border-slate-900">
              <td class="py-4 px-4">
                <p class="font-bold text-slate-900">Tổng cộng hóa đơn</p>
              </td>
              <td class="text-right py-4 px-4" colspan="2"></td>
              <td class="text-right py-4 px-4">
                <p class="font-bold text-xl text-red-500">
                  ${formatCurrency(payment.amount)}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
