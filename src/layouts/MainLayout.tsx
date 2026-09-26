import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Package, ShoppingCart, 
  Users, CreditCard, Wallet, FileText, Database, 
  Settings, Search, Bell, Moon, ChevronDown, Activity
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if the event was already fired before React mounted
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', () => {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setIsInstallable(true);
      }
    });
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Ilova allaqachon o'rnatilgan yoki brauzeringiz PWA o'rnatishni qo'llab-quvvatlamaydi (Buning uchun Chrome/Edge/Safari dasturidan foydalaning va ilovani o'rnatmaganingizga ishonch hosil qiling).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
        setIsDesktopCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeSidebarMobile = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebarMobile = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopCollapse = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  const menuItems = [
    { path: '/', name: 'Asosiy', icon: <LayoutDashboard size={20} /> },
    { path: '/products', name: 'Mahsulotlar', icon: <Package size={20} /> },
    { path: '/sales', name: 'Sotuvlar', icon: <ShoppingCart size={20} /> },
    { path: '/customers', name: 'Mijozlar', icon: <Users size={20} /> },
    { path: '/debts', name: 'Qarzdorlar', icon: <CreditCard size={20} /> },
    { path: '/expenses', name: 'Xarajatlar', icon: <Wallet size={20} /> },
    { path: '/reports', name: 'Hisobotlar', icon: <FileText size={20} /> },
    { path: '/backup', name: 'Nusxalash', icon: <Database size={20} /> },
    { path: '/settings', name: 'Sozlamalar', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={closeSidebarMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 ease-in-out shadow-xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopCollapsed ? 'lg:w-20' : 'w-72 lg:w-72'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/60 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${isDesktopCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
              <Activity size={24} />
            </div>
            {!isDesktopCollapsed && (
              <div className="flex flex-col whitespace-nowrap animate-fadeIn">
                <span className="text-xl font-bold text-white tracking-tight">CRM PWA</span>
                <span className="text-xs text-slate-400 font-medium">Biznesingiz nazoratda</span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button 
            className="lg:hidden ml-auto p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            onClick={closeSidebarMobile}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    onClick={closeSidebarMobile}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-900/20' 
                        : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                      }
                      ${isDesktopCollapsed ? 'justify-center' : ''}
                    `}
                    title={isDesktopCollapsed ? item.name : undefined}
                  >
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </div>
                    {!isDesktopCollapsed && (
                      <span className="font-medium whitespace-nowrap">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {!isInstallable && (
          <div className="px-4 pb-4 shrink-0">
            <button
              onClick={handleInstallClick}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95
                ${isDesktopCollapsed ? 'px-0' : 'px-4'}
              `}
              title="Ilovani o'rnatish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              {!isDesktopCollapsed && <span>Ilovani o'rnatish</span>}
            </button>
          </div>
        )}
        
        {isInstallable && (
          <div className="px-4 pb-4 shrink-0">
            <button
              onClick={handleInstallClick}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95
                ${isDesktopCollapsed ? 'px-0' : 'px-4'}
              `}
              title="Ilovani o'rnatish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              {!isDesktopCollapsed && <span>Ilovani o'rnatish</span>}
            </button>
          </div>
        )}

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-slate-800/60 shrink-0">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/50 ${isDesktopCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
            </div>
            {!isDesktopCollapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-white truncate">Admin</span>
                  <span className="text-xs text-blue-400 truncate">Super Admin</span>
                </div>
                <ChevronDown size={16} className="text-slate-500 shrink-0" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm h-20 flex items-center justify-between px-4 lg:px-8 shrink-0 border-b border-gray-200/50 z-30 sticky top-0">
          
          {/* Header Left */}
          <div className="flex items-center gap-4">
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 rounded-xl transition-all"
              onClick={window.innerWidth >= 1024 ? toggleDesktopCollapse : toggleSidebarMobile}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex flex-col">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">CRM Tizimi</h2>
              <span className="text-xs text-slate-500 font-medium">Boshqaruv paneli</span>
            </div>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Qidiruv..." 
                className="pl-10 pr-4 py-2 bg-slate-100/80 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all w-64 placeholder:text-slate-400 outline-none"
              />
            </div>

            {/* Theme Toggle (Visual only for now) */}
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all relative">
              <Moon size={20} />
            </button>

            {/* Notifications */}
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all relative group">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-800">Admin</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
