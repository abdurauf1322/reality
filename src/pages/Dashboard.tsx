import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  CreditCard,
  Wallet,
  ArrowRight,
  Calendar,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
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
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };
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
      
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">👋</span> Xush kelibsiz, Admin!
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Bugungi faoliyatingizni quyidagi ko'rsatkichlar orqali kuzatishingiz mumkin. Barcha ma'lumotlar real vaqtda yangilanmoqda.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-300">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-slate-300 text-xs uppercase tracking-wider font-semibold mb-1">Bugungi sana</p>
            <p className="font-bold text-white whitespace-nowrap">{getTodayDateString()}</p>
          </div>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Bugungi savdo */}
        <Link to="/sales" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-blue-600">
            <TrendingUp size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Bugungi savdo</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-3 relative z-10">{formatPrice(data.todaySales)}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg font-medium">
              <ArrowUpRight size={14} className="mr-1" /> O'sish
            </span>
            <span>Faoliyat faol</span>
          </div>
        </Link>

        {/* Shu oy savdosi */}
        <Link to="/sales" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-emerald-600">
            <ShoppingCart size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
              <ShoppingCart size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Shu oy savdosi</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-3 relative z-10">{formatPrice(data.monthSales)}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg font-medium">
              <BarChart3 size={14} className="mr-1" /> Joriy oy
            </span>
            <span>Jami tushumlar</span>
          </div>
        </Link>

        {/* Ochiq qarz */}
        <Link to="/debts" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-orange-600">
            <CreditCard size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
              <CreditCard size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Ochiq qarz</h3>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-3 relative z-10">{formatPrice(data.openDebt)}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg font-medium">
              <ArrowDownRight size={14} className="mr-1" /> Diqqat
            </span>
            <span>Undirilishi kerak</span>
          </div>
        </Link>

        {/* Shu oy xarajati */}
        <Link to="/expenses" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-red-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-red-600">
            <Wallet size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
              <Wallet size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Shu oy xarajati</h3>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-3 relative z-10">{formatPrice(data.monthExpenses)}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-red-500 bg-red-50 px-2 py-0.5 rounded-lg font-medium">
              <ArrowUpRight size={14} className="mr-1" /> Chiqim
            </span>
            <span>Joriy oydagi xarajatlar</span>
          </div>
        </Link>

        {/* Mijozlar */}
        <Link to="/customers" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-indigo-600">
            <Users size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
              <Users size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Mijozlar</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-3 relative z-10">{data.activeCustomersCount} <span className="text-lg text-slate-400 font-medium">ta</span></p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg font-medium">
              <CheckCircle2 size={14} className="mr-1" /> Faol
            </span>
            <span>Baza hajmi</span>
          </div>
        </Link>

        {/* Mahsulotlar */}
        <Link to="/products" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-fuchsia-100 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 text-fuchsia-600">
            <Package size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-colors shadow-sm">
              <Package size={24} />
            </div>
            <h3 className="font-semibold text-slate-600">Mahsulotlar</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-3 relative z-10">{data.totalProductsCount} <span className="text-lg text-slate-400 font-medium">xil</span></p>
          <div className="flex items-center gap-2 text-sm text-slate-500 relative z-10">
            <span className="flex items-center text-fuchsia-500 bg-fuchsia-50 px-2 py-0.5 rounded-lg font-medium">
              <Package size={14} className="mr-1" /> Ombor
            </span>
            <span>Turdagi mahsulotlar</span>
          </div>
        </Link>

      </div>

      {/* 3. Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Bugungi xulosa */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Bugungi xulosa</h3>
            </div>
          </div>
          
          {data.todaySales === 0 && data.todayExpenses === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Clock size={32} className="text-slate-400 mb-3" />
              <p className="font-semibold text-slate-700 mb-1">Bugungi kunda faoliyat yo'q</p>
              <p className="text-sm text-slate-500 max-w-[250px]">Yangi savdo yoki xarajat kirsa, bu yerda ko'rinadi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Savdo tushumi
                </span>
                <span className="font-bold text-slate-800">{formatPrice(data.todaySales)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Xarajatlar
                </span>
                <span className="font-bold text-red-600">{formatPrice(data.todayExpenses)}</span>
              </div>
              <div className={`flex justify-between items-center p-5 rounded-2xl border ${todayDiff >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <span className={`font-bold ${todayDiff >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>Bugungi farq (sof)</span>
                <span className={`text-xl font-bold ${todayDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {todayDiff > 0 ? '+' : ''}{formatPrice(todayDiff)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Joriy oy xulosasi */}
        <div className="bg-[#0f172a] rounded-3xl p-6 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Joriy oy xulosasi</h3>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <span className="text-slate-300 font-medium">Jami savdo</span>
              <span className="font-bold text-emerald-400">{formatPrice(data.monthSales)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <span className="text-slate-300 font-medium">Jami xarajat</span>
              <span className="font-bold text-red-400">{formatPrice(data.monthExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/20 backdrop-blur-sm">
              <span className="font-bold text-orange-200">Umumiy ochiq qarz</span>
              <span className="text-xl font-bold text-orange-400">{formatPrice(data.openDebt)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* So'nggi sotuvlar */}
        <div className="bg-white rounded-3xl flex flex-col shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={18} className="text-blue-500" /> So'nggi sotuvlar
            </h3>
            <Link to="/sales" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group transition-colors">
              Barchasi <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-2 flex-1">
            {data.recentSales.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Hozircha sotuvlar mavjud emas.</p>
                <p className="text-sm text-slate-400 mt-1">Yangi savdo qo'shilganda bu yerda ko'rinadi.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {data.recentSales.map(sale => {
                  const customerName = sale.customerId && data.recentSalesCustomers[sale.customerId]
                    ? data.recentSalesCustomers[sale.customerId].name
                    : "Mijoz ko'rsatilmagan";
                  
                  return (
                    <div key={sale.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors flex justify-between items-center group">
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{customerName}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-slate-500 font-medium">{formatDate(sale.createdAt)} {formatTime(sale.createdAt)}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                            sale.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-700' : 
                            sale.paymentType === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {sale.paymentType === 'cash' ? 'Naqd' : sale.paymentType === 'card' ? 'Karta' : 'Qarz'}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 text-lg">{formatPrice(sale.total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* So'nggi qarzlar */}
        <div className="bg-white rounded-3xl flex flex-col shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-orange-500" /> So'nggi qarzlar
            </h3>
            <Link to="/debts" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group transition-colors">
              Barchasi <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-2 flex-1">
            {data.recentDebts.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <CreditCard size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Hozircha qarzlar mavjud emas.</p>
                <p className="text-sm text-slate-400 mt-1">Yangi qarz yozilganda bu yerda ko'rinadi.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {data.recentDebts.map(debt => {
                  const customerName = data.recentDebtsCustomers[debt.customerId]?.name || "Noma'lum";
                  return (
                    <div key={debt.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors flex flex-col gap-2 group">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{customerName}</p>
                        <span className="text-xs text-slate-500 font-medium">{formatDate(debt.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-orange-400 h-full rounded-full" 
                            style={{ width: `${(debt.remainingAmount / debt.originalAmount) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-orange-600 text-sm whitespace-nowrap">{formatPrice(debt.remainingAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* So'nggi xarajatlar */}
        <div className="bg-white rounded-3xl flex flex-col shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Wallet size={18} className="text-red-500" /> So'nggi xarajatlar
            </h3>
            <Link to="/expenses" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group transition-colors">
              Barchasi <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-2 flex-1">
            {data.recentExpenses.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Wallet size={24} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">Hozircha xarajatlar mavjud emas.</p>
                <p className="text-sm text-slate-400 mt-1">Xarajat qo'shilganda bu yerda ko'rinadi.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {data.recentExpenses.map(exp => (
                  <div key={exp.id} className="p-4 hover:bg-slate-50 rounded-2xl transition-colors flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-red-600 transition-colors">{exp.categoryName}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{formatDate(exp.date)} {formatTime(exp.date)}</p>
                    </div>
                    <span className="font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">{formatPrice(exp.amount)}</span>
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
