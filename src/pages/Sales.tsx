import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Package, Banknote, CreditCard, ShieldAlert, ArrowRight, User, X } from 'lucide-react';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { customerService } from '../services/customerService';
import type { Product, SaleItem, Sale, Customer } from '../types';

import { CustomerSelector } from '../components/CustomerSelector';
import { CustomerModal } from '../components/CustomerModal';

type CartItem = SaleItem & { stockQuantity: number };

const Sales = () => {
  // State for Sales History
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // State for New Sale
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pos_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [discount, setDiscount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'debt'>(() => {
    return (localStorage.getItem('pos_payment_type') as any) || 'cash';
  });
  const [customerId, setCustomerId] = useState<string>(() => {
    return localStorage.getItem('pos_customer_id') || '';
  });

  // Save to localStorage whenever these change
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_payment_type', paymentType);
  }, [paymentType]);

  useEffect(() => {
    localStorage.setItem('pos_customer_id', customerId);
  }, [customerId]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Load Sales History
  const loadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const data = await saleService.getSales();
      setSalesHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle Search (Name only in UI logic filter)
  useEffect(() => {
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const allProducts = await productService.getProducts();
        if (!searchQuery.trim()) {
          setSearchResults(allProducts);
        } else {
          const lowerQuery = searchQuery.trim().toLowerCase();
          const results = allProducts.filter(p => p.name.toLowerCase().includes(lowerQuery));
          setSearchResults(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };
    
    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Cart operations
  const addToCart = (product: Product) => {
    setError(null);
    if (product.quantity <= 0) {
      setError(`"${product.name}" omborda mavjud emas.`);
      // Show error briefly then clear
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.quantity) {
          setError("Omborda yetarli mahsulot mavjud emas.");
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.sellingPrice,
        quantity: 1,
        total: product.sellingPrice,
        stockQuantity: product.quantity
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setError(null);
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item; // Min quantity is 1
          if (newQty > item.stockQuantity) {
            setError("Omborda yetarli mahsulot mavjud emas.");
            setTimeout(() => setError(null), 3000);
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.price };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const finalTotal = Math.max(0, subtotal - discount);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'debt' && !customerId) {
      setError("Qarzga sotuv uchun mijoz tanlash majburiy.");
      return;
    }
    
    setError(null);
    setCheckoutLoading(true);

    let paidAmount = 0;
    let debtAmount = 0;
    
    if (paymentType === 'cash' || paymentType === 'card') {
      paidAmount = finalTotal;
      debtAmount = 0;
    } else {
      paidAmount = 0;
      debtAmount = finalTotal;
    }

    try {
      // Remove stockQuantity from cart items before sending to backend (if necessary)
      const cleanCartItems: SaleItem[] = cart.map(({ stockQuantity, ...rest }) => rest);

      await saleService.createSale({
        customerId: customerId || undefined,
        items: cleanCartItems,
        subtotal,
        discount,
        total: finalTotal,
        paymentType,
        paidAmount,
        debtAmount
      });
      
      // Reset cart and reload history
      setCart([]);
      setDiscount(0);
      setPaymentType('cash');
      setCustomerId('');
      
      // We must reload search results to reflect the new stock quantities
      const updatedProducts = await productService.getProducts();
      if (!searchQuery.trim()) {
        setSearchResults(updatedProducts);
      } else {
        const lowerQuery = searchQuery.trim().toLowerCase();
        setSearchResults(updatedProducts.filter(p => p.name.toLowerCase().includes(lowerQuery)));
      }

      await loadHistory();
      setIsMobileCartOpen(false); // Close drawer after successful purchase
    } catch (err: any) {
      setError(err.message || "Sotuvni amalga oshirishda xatolik yuz berdi");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm("Bu sotuvni bekor qilib, mahsulotlarni omborga qaytarishni xohlaysizmi?")) {
      try {
        await saleService.deleteSale(id);
        
        // Reload products
        const updatedProducts = await productService.getProducts();
        if (!searchQuery.trim()) {
          setSearchResults(updatedProducts);
        } else {
          const lowerQuery = searchQuery.trim().toLowerCase();
          setSearchResults(updatedProducts.filter(p => p.name.toLowerCase().includes(lowerQuery)));
        }

        await loadHistory();
      } catch (err: any) {
        alert(err.message || "Xatolik yuz berdi");
      }
    }
  };

  const handleSaveNewCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>) => {
    const newCustomer = await customerService.createCustomer(customerData);
    setCustomerId(newCustomer.id);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  const formatDate = (isoString: string) => new Date(isoString).toLocaleString('uz-UZ', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-24 lg:pb-6 pr-2">
      
      {/* Top Section: Products and Cart */}
      <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[650px] lg:h-[70vh] shrink-0 mb-6">
        
        {/* Left: Products Grid */}
        <div className="flex-1 flex flex-col bg-transparent lg:bg-white lg:rounded-3xl lg:shadow-sm lg:border lg:border-slate-100 lg:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package size={24} className="text-blue-600" /> Mahsulotlar
            </h2>
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Mahsulot nomi bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {searchResults.length === 0 && !isSearching && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Package size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-600 font-medium text-lg">Mahsulotlar topilmadi</p>
                <p className="text-slate-400 text-sm mt-1">Boshqa nom bilan qidirib ko'ring</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map(product => {
                const isAvailable = product.quantity > 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => isAvailable && addToCart(product)}
                    disabled={!isAvailable}
                    className={`relative p-5 rounded-2xl border flex flex-col text-left transition-all group overflow-hidden ${
                      isAvailable 
                        ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5' 
                        : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Placeholder Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isAvailable ? 'bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform' : 'bg-slate-200 text-slate-400'}`}>
                      <Package size={24} />
                    </div>
                    
                    <h3 className="font-bold text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                    
                    <div className="mt-auto pt-3 flex flex-col gap-1.5">
                      <span className={`font-bold text-lg ${isAvailable ? 'text-blue-600' : 'text-slate-500'}`}>
                        {formatPrice(product.sellingPrice)}
                      </span>
                      
                      {isAvailable ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-block w-fit">
                          Mavjud: {product.quantity} dona
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md inline-block w-fit">
                          Mavjud emas
                        </span>
                      )}
                    </div>

                    {isAvailable && (
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className={`
          fixed inset-0 z-50 lg:static lg:z-auto
          ${isMobileCartOpen ? 'flex' : 'hidden lg:flex'}
          w-full lg:w-[350px] xl:w-[420px] bg-black/50 lg:bg-transparent flex-col shrink-0 justify-end lg:justify-start transition-all
        `}>
          <div className={`
            w-full h-[85vh] lg:h-full bg-white lg:rounded-3xl shadow-sm border-t lg:border border-slate-100 p-4 flex flex-col relative overflow-hidden rounded-t-3xl lg:rounded-t-3xl
            transition-transform duration-300 transform
            ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          `}>
            
          <button 
            onClick={() => setIsMobileCartOpen(false)} 
            className="lg:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
            <div className="flex gap-2.5 items-center">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingCart size={20} />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-base font-black text-slate-800 leading-tight">Savat</h2>
                <p className="text-[11px] font-semibold text-slate-400">Tanlangan mahsulotlar</p>
              </div>
            </div>
          </div>
          
          {/* Error Message Toast */}
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 z-50 ${error ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            <ShieldAlert size={16} className="shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto mb-3 custom-scrollbar pr-1.5 min-h-[100px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart size={40} className="mb-2 text-slate-200" />
                <p className="font-bold text-sm text-slate-500">Savat bo'sh</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map(item => (
                  <li key={item.productId} className="bg-white border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] rounded-xl p-3 flex flex-col gap-1.5 group hover:border-blue-100 transition-colors">
                    <div className="flex gap-2">
                       <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                         <Package size={16} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <span className="font-bold text-slate-800 line-clamp-1 text-[13px]">{item.productName}</span>
                             <span className="font-semibold text-slate-500 whitespace-nowrap ml-2 text-[11px]">{formatPrice(item.price)}</span>
                          </div>
                          
                          <div className="flex justify-between items-end mt-1.5">
                             <div className="flex flex-col">
                                <span className="font-black text-blue-600 text-[13px] leading-tight">{formatPrice(item.total)}</span>
                                <span className="text-[9px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-1 py-0.5 rounded w-fit mt-0.5">
                                  ✓ Mavjud: {item.stockQuantity}
                                </span>
                             </div>
                             
                             <div className="flex items-center gap-1.5 shrink-0">
                                <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                                  <button 
                                    onClick={() => {
                                      if (item.quantity <= 1) removeFromCart(item.productId);
                                      else updateQuantity(item.productId, -1);
                                    }} 
                                    className="w-6 h-6 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100 rounded-md shadow-sm transition-colors"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-5 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.productId, 1)} 
                                    disabled={item.quantity >= item.stockQuantity} 
                                    className="w-6 h-6 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100 rounded-md shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.productId)} 
                                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Checkout Footer */}
          <div className="flex flex-col gap-3 shrink-0 pt-2 border-t border-slate-50">
            
            {/* Summary Box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
               <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Jami: {cart.reduce((a,c)=>a+c.quantity,0)} ta</p>
                  </div>
                  <span className="font-bold text-slate-800 text-xs">{formatPrice(subtotal)}</span>
               </div>
               
               <div className="space-y-1.5">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-medium">Subtotal:</span>
                   <span className="font-bold text-slate-700">{formatPrice(subtotal)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-500 font-medium">Chegirma:</span>
                   <input 
                     type="number" 
                     min="0" 
                     value={discount || ''} 
                     onChange={e => setDiscount(Number(e.target.value) || 0)} 
                     className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-md text-right font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                     placeholder="0" 
                   />
                 </div>
               </div>
               
               <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-800 font-black text-sm">Jami:</span>
                  <span className="text-blue-600 font-black text-lg leading-none">{formatPrice(finalTotal)}</span>
               </div>
            </div>
            
            {/* Payment Type */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">To'lov turi</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button 
                  onClick={() => setPaymentType('cash')}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg border-2 transition-all ${paymentType === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <Banknote size={16} />
                  <span className="text-[10px] font-bold">Naqd</span>
                </button>
                <button 
                  onClick={() => setPaymentType('card')}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg border-2 transition-all ${paymentType === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <CreditCard size={16} />
                  <span className="text-[10px] font-bold">Karta</span>
                </button>
                <button 
                  onClick={() => setPaymentType('debt')}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg border-2 transition-all ${paymentType === 'debt' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <User size={16} />
                  <span className="text-[10px] font-bold">Qarz</span>
                </button>
              </div>
            </div>

            {/* Customer Selector */}
            <div className="space-y-1.5">
               <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                 {paymentType === 'debt' ? 'Mijoz (majburiy)' : 'Mijoz (ixtiyoriy)'}
               </label>
               <div className="bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                 <CustomerSelector
                   selectedCustomerId={customerId}
                   onSelect={setCustomerId}
                   onAddNew={() => setIsCustomerModalOpen(true)}
                   required={paymentType === 'debt'}
                 />
               </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group"
            >
              {checkoutLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <ShoppingCart size={16} className="group-hover:-rotate-12 transition-transform" />
                  Sotuvni yakunlash 
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
          </div>
        </div>

      </div>

      {/* Mobile Cart Floating Action Button (FAB) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-40">
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 font-bold text-lg flex items-center justify-between px-6 transition-transform active:scale-95"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={24} />
            <span>Savat</span>
          </div>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-black">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
            <span className="font-black">{formatPrice(finalTotal)}</span>
          </div>
        </button>
      </div>

      {/* Bottom Section: Sales History */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-[300px] overflow-hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Receipt size={20} className="text-blue-600" /> Sotuvlar tarixi
        </h2>
        
        {isLoadingHistory ? (
           <div className="flex-1 flex justify-center items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
           </div>
        ) : salesHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Receipt size={40} className="text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">Bugun hali sotuv amalga oshirilmagan.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {salesHistory.map(sale => (
                <div key={sale.id} className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-4 shadow-sm hover:shadow transition-all group flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {formatDate(sale.createdAt)}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                      sale.paymentType === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                      sale.paymentType === 'card' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {sale.paymentType === 'cash' ? 'Naqd' : sale.paymentType === 'card' ? 'Karta' : 'Qarz'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Maxsulotlar ({sale.items.reduce((acc, item) => acc + item.quantity, 0)} ta):</p>
                    <div className="space-y-1 mb-3">
                      {sale.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-sm font-medium text-slate-700 line-clamp-1">
                          {item.quantity} × {item.productName}
                        </p>
                      ))}
                      {sale.items.length > 2 && (
                        <p className="text-xs text-slate-400">+{sale.items.length - 2} ta yana...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-slate-50 mt-auto">
                    <span className="font-bold text-lg text-slate-800">{formatPrice(sale.total)}</span>
                    <button 
                      onClick={() => handleDeleteSale(sale.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Sotuvni bekor qilish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveNewCustomer}
      />
    </div>
  );
};

export default Sales;
