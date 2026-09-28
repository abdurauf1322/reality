import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  CreditCard,
  Wallet,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { dashboardService, type DashboardData } from '../services/dashboardService';

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || "Dashboard ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const getTodayDateString = () => {
    const date = new Date();
    return date.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-40 bg-slate-200 animate-pulse rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md text-center border border-red-100 shadow-sm">
          <AlertTriangle size={48} className="text-red-500" />
          <h3 className="text-xl font-bold">Xatolik yuz berdi</h3>
          <p className="text-red-600/80">{error}</p>
          <button onClick={loadData} className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium">
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isNewCrm = data.totalProductsCount === 0 && data.recentSales.length === 0;

  if (isNewCrm) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[500px]">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-10 max-w-xl text-center border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-700"></div>
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={40} className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Xush kelibsiz!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed text-lg">
            CRM tizimi muvaffaqiyatli o'rnatildi. Ishni boshlash uchun dastlab mahsulotlarni qo'shing va birinchi sotuvni amalga oshiring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 font-medium transition-all transform hover:-translate-y-0.5">
              Mahsulot qo'shish
            </Link>
            <Link to="/sales" className="px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 font-medium transition-all transform hover:-translate-y-0.5">
              Sotuvlarga o'tish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayDiff = data.todaySales - data.todayExpenses;

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Xush kelibsiz, Admin!</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bugun: <span className="font-semibold text-slate-700">{getTodayDateString()}</span>
          </p>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <Link to="/sales" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bugungi savdo</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatPrice(data.todaySales)}</span>
        </Link>

        <Link to="/expenses" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-red-200 transition-colors flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Wallet size={16} className="text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Bugungi xarajat</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatPrice(data.todayExpenses)}</span>
        </Link>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Activity size={16} className={todayDiff >= 0 ? "text-emerald-500" : "text-red-500"} />
            <span className="text-xs font-semibold uppercase tracking-wider">Sof foyda</span>
          </div>
          <span className={`text-lg font-bold ${todayDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {todayDiff > 0 ? '+' : ''}{formatPrice(todayDiff)}
          </span>
        </div>

        <Link to="/debts" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CreditCard size={16} className="text-orange-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Qarzdorlik</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{formatPrice(data.openDebt)}</span>
        </Link>

        <Link to="/products" className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package size={16} className="text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">Mahsulotlar</span>
          </div>
          <span className="text-lg font-bold text-slate-800">{data.totalProductsCount} xil</span>
        </Link>

        <Link to="/products" className={`bg-white p-4 rounded-xl border ${data.lowStockProducts.length > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'} shadow-sm hover:border-orange-300 transition-colors flex flex-col gap-2`}>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle size={16} className={data.lowStockProducts.length > 0 ? "text-orange-500" : "text-slate-400"} />
            <span className="text-xs font-semibold uppercase tracking-wider">Kam qolgan</span>
          </div>
          <span className={`text-lg font-bold ${data.lowStockProducts.length > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
            {data.lowStockProducts.length} ta
          </span>
        </Link>

      </div>

      {/* 3. Analytics & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* So'nggi sotuvlar */}
        <div className="bg-white rounded-2xl flex flex-col shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-500" /> So'nggi sotuvlar
            </h3>
            <Link to="/sales" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Barchasi</Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <ShoppingCart size={32} className="mb-2 opacity-50" />
                <p className="font-medium text-sm">Sotuvlar mavjud emas</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {data.recentSales.slice(0, 5).map(sale => {
                  const customerName = sale.customerId && data.recentSalesCustomers[sale.customerId]
                    ? data.recentSalesCustomers[sale.customerId].name
                    : "Mijozsiz";
                  return (
                    <div key={sale.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{customerName}</p>
                        <p className="text-[11px] text-slate-500">{formatTime(sale.createdAt)} · {sale.paymentType === 'cash' ? 'Naqd' : sale.paymentType === 'card' ? 'Karta' : 'Qarz'}</p>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{formatPrice(sale.total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kam qolgan mahsulotlar */}
        <div className="bg-white rounded-2xl flex flex-col shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Kam qolgan mahsulotlar
            </h3>
            <Link to="/products" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Barchasi</Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
            {data.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 opacity-50 text-emerald-500" />
                <p className="font-medium text-sm text-slate-500">Barcha mahsulotlar yetarli</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {data.lowStockProducts.slice(0, 5).map(prod => (
                  <div key={prod.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{prod.name}</p>
                      <p className="text-[11px] text-slate-500">Minimal: {prod.minQuantity}</p>
                    </div>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-sm">{prod.quantity} ta</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
