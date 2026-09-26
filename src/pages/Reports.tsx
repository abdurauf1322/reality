import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart2, 
  Calendar, 
  ArrowRight
} from 'lucide-react';
import { reportService, type SalesReport, type ExpensesReport, type DebtReport, type DebtPaymentReport, type ProductSalesReport, type CustomerSalesReport, type ReportSummary } from '../services/reportService';
import { Link } from 'react-router-dom';

const Reports = () => {
  // State for Date Range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [dateError, setDateError] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('thisMonth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Report Data States
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [expensesReport, setExpensesReport] = useState<ExpensesReport | null>(null);
  const [debtReport, setDebtReport] = useState<DebtReport | null>(null);
  const [paymentReport, setPaymentReport] = useState<DebtPaymentReport | null>(null);
  const [productReport, setProductReport] = useState<ProductSalesReport[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerSalesReport[]>([]);

  const loadData = useCallback(async () => {
    setDateError('');
    setError('');

    if (new Date(startDate) > new Date(endDate)) {
      setDateError("Boshlanish sanasi tugash sanasidan katta bo'lishi mumkin emas.");
      return;
    }

    setIsLoading(true);
    try {
      const [sum, sales, exp, debt, pay, prod, cust] = await Promise.all([
        reportService.getReportSummary(startDate, endDate),
        reportService.getSalesReport(startDate, endDate),
        reportService.getExpensesReport(startDate, endDate),
        reportService.getDebtReport(startDate, endDate),
        reportService.getDebtPaymentReport(startDate, endDate),
        reportService.getProductSalesReport(startDate, endDate),
        reportService.getCustomerSalesReport(startDate, endDate)
      ]);

      setSummary(sum);
      setSalesReport(sales);
      setExpensesReport(exp);
      setDebtReport(debt);
      setPaymentReport(pay);
      setProductReport(prod);
      setCustomerReport(cust);

    } catch (err: any) {
      setError(err.message || "Hisobotni yuklashda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Quick Filters
  const setQuickFilter = (type: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth') => {
    setActiveFilter(type);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'thisWeek':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        break;
      case 'thisMonth':
        start.setDate(1);
        break;
      case 'lastMonth':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';

  const hasData = summary && (summary.salesCount > 0 || summary.expensesCount > 0 || summary.openDebt > 0);

  return (
    <div className="flex flex-col h-full space-y-6 p-4 sm:p-6 overflow-y-auto">
      
      <div className="flex items-center gap-2">
        <BarChart2 className="text-blue-600 h-8 w-8" />
        <h1 className="text-2xl font-bold text-gray-900">Hisobotlar</h1>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish</label>
              <input 
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setActiveFilter(''); }}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>
            <div className="hidden sm:block text-gray-400 mt-6">-</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tugash</label>
              <input 
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setActiveFilter(''); }}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Bugun' },
              { id: 'yesterday', label: 'Kecha' },
              { id: 'thisWeek', label: 'Shu hafta' },
              { id: 'thisMonth', label: 'Shu oy' },
              { id: 'lastMonth', label: "O'tgan oy" }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setQuickFilter(f.id as any)} 
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  activeFilter === f.id 
                    ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {dateError && <p className="text-red-500 text-sm mt-2 font-medium">{dateError}</p>}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Hisobot yuklanmoqda...</p>
        </div>
      ) : !hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-dashed rounded-lg min-h-[300px]">
          <Calendar className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">Tanlangan davr uchun ma'lumot mavjud emas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Summaries */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Jami savdo</p>
              <p className="text-lg font-bold text-green-700 truncate" title={formatPrice(summary!.totalSales)}>{formatPrice(summary!.totalSales)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Jami xarajat</p>
              <p className="text-lg font-bold text-red-600 truncate" title={formatPrice(summary!.totalExpenses)}>{formatPrice(summary!.totalExpenses)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Ochiq qarz</p>
              <p className="text-lg font-bold text-orange-600 truncate" title={formatPrice(summary!.openDebt)}>{formatPrice(summary!.openDebt)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Sotuvlar soni</p>
              <p className="text-lg font-bold text-gray-900">{summary!.salesCount} ta</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Xarajatlar soni</p>
              <p className="text-lg font-bold text-gray-900">{summary!.expensesCount} ta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sales vs Expenses Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-900">
                Savdo va Xarajat
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Savdo</p>
                    <p className="text-xl font-bold text-green-700">{formatPrice(summary!.totalSales)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm">Xarajat</p>
                    <p className="text-xl font-bold text-red-600">{formatPrice(summary!.totalExpenses)}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                  <span className="font-semibold text-blue-900">Savdo va xarajat farqi</span>
                  <span className={`font-bold text-xl ${summary!.totalSales - summary!.totalExpenses >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatPrice(summary!.totalSales - summary!.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Type Report */}
            {salesReport && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 flex justify-between items-center">
                  <span>To'lov turlari bo'yicha</span>
                  <Link to="/sales" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">Savdolar <ArrowRight size={14}/></Link>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                      <span className="font-medium">Naqd</span>
                      <span className="font-bold text-green-700">{formatPrice(salesReport.byPaymentType.cash)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                      <span className="font-medium">Karta</span>
                      <span className="font-bold text-blue-700">{formatPrice(salesReport.byPaymentType.card)}</span>
                    </div>
                    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Qarzga berilgan tovarlar qiymati</span>
                        <span className="font-bold text-orange-700">{formatPrice(salesReport.byPaymentType.debt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-orange-200">
                        <span className="text-gray-600">Shundan to'landi (boshlang'ich):</span>
                        <span className="font-semibold text-green-600">{formatPrice(salesReport.byPaymentType.paidAmountFromDebt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-orange-200">
                        <span className="text-gray-600">Haqiqiy qarzga aylandi:</span>
                        <span className="font-semibold text-orange-600">{formatPrice(salesReport.byPaymentType.actualDebtAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">O'rtacha chek: <span className="font-bold text-gray-900">{formatPrice(salesReport.averageSale)}</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Expense Categories */}
            {expensesReport && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 flex justify-between items-center">
                  <span>Xarajat kategoriyalari</span>
                  <Link to="/expenses" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">Xarajatlar <ArrowRight size={14}/></Link>
                </div>
                {expensesReport.byCategory.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 text-sm">Xarajatlar mavjud emas.</p>
                ) : (
                  <div className="p-4">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-600">
                          <th className="pb-2 font-medium">Kategoriya</th>
                          <th className="pb-2 font-medium text-right">Soni</th>
                          <th className="pb-2 font-medium text-right">Jami</th>
                          <th className="pb-2 font-medium text-right">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expensesReport.byCategory.map(c => (
                          <tr key={c.categoryId}>
                            <td className="py-3 font-medium text-gray-900">{c.categoryName}</td>
                            <td className="py-3 text-right text-gray-500">{c.count}</td>
                            <td className="py-3 text-right font-semibold text-red-600">{formatPrice(c.totalAmount)}</td>
                            <td className="py-3 text-right text-gray-500">
                              <div className="flex items-center justify-end gap-2">
                                <span>{c.percentage.toFixed(1)}%</span>
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500" style={{ width: `${c.percentage}%` }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Debts */}
            {(debtReport || paymentReport) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 flex justify-between items-center">
                  <span>Qarzlar holati (Tanlangan davrda ochilgan)</span>
                  <Link to="/debts" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">Qarzlar <ArrowRight size={14}/></Link>
                </div>
                <div className="p-4 space-y-6">
                  
                  {debtReport && (
                    <div className="grid grid-cols-3 gap-2 text-center border-b pb-4">
                      <div className="bg-red-50 p-2 rounded">
                        <p className="text-xs text-red-800 font-medium mb-1">To'lanmagan</p>
                        <p className="text-lg font-bold text-red-600">{debtReport.unpaidCount}</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="text-xs text-orange-800 font-medium mb-1">Qisman</p>
                        <p className="text-lg font-bold text-orange-600">{debtReport.partialCount}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-800 font-medium mb-1">To'langan</p>
                        <p className="text-lg font-bold text-green-600">{debtReport.paidCount}</p>
                      </div>
                    </div>
                  )}

                  {paymentReport && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 text-sm">Shu davrdagi qarz to'lovlari ({paymentReport.paymentsCount} ta)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">Naqd orqali:</span>
                          <span className="font-semibold">{formatPrice(paymentReport.cashPaid)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">Karta orqali:</span>
                          <span className="font-semibold">{formatPrice(paymentReport.cardPaid)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100">
                          <span className="font-bold text-green-900">Jami to'langan qarz:</span>
                          <span className="font-bold text-green-700">{formatPrice(paymentReport.totalPaid)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Product Sales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 sticky top-0 flex justify-between items-center">
                <span>Mahsulotlar savdosi</span>
                <Link to="/products" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">Tovarlar <ArrowRight size={14}/></Link>
              </div>
              <div className="overflow-y-auto p-0">
                {productReport.length === 0 ? (
                   <p className="p-4 text-center text-gray-500 text-sm">Sotilgan mahsulotlar yo'q.</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0 border-b shadow-sm text-gray-600">
                      <tr>
                        <th className="py-2 px-4 font-medium">Mahsulot</th>
                        <th className="py-2 px-4 font-medium text-right">Sotilgan</th>
                        <th className="py-2 px-4 font-medium text-right">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productReport.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium text-gray-900">{p.productName}</td>
                          <td className="py-2 px-4 text-right font-bold text-gray-700">{p.quantitySold}</td>
                          <td className="py-2 px-4 text-right text-green-700 font-medium">{formatPrice(p.totalSum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Customer Sales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-4 bg-gray-50 border-b font-bold text-gray-900 sticky top-0 flex justify-between items-center">
                <span>Mijozlar bo'yicha savdo</span>
                <Link to="/customers" className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline">Mijozlar <ArrowRight size={14}/></Link>
              </div>
              <div className="overflow-y-auto p-0">
                {customerReport.length === 0 ? (
                   <p className="p-4 text-center text-gray-500 text-sm">Xaridorlar yo'q.</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0 border-b shadow-sm text-gray-600">
                      <tr>
                        <th className="py-2 px-4 font-medium">Mijoz</th>
                        <th className="py-2 px-4 font-medium text-right">Sotuvlar</th>
                        <th className="py-2 px-4 font-medium text-right">Jami</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customerReport.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium text-gray-900">
                            {c.customerId ? (
                              <Link to="/customers" className="hover:text-blue-600 hover:underline">{c.customerName}</Link>
                            ) : c.customerName}
                          </td>
                          <td className="py-2 px-4 text-right font-medium text-gray-700">{c.salesCount}</td>
                          <td className="py-2 px-4 text-right text-green-700 font-medium">{formatPrice(c.totalSum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
