import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { X, AlertCircle, Save, Package, Barcode, Tags, DollarSign, Layers, Hash } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  productToEdit?: Product;
}

export const ProductModal = ({ isOpen, onClose, onSave, productToEdit }: ProductModalProps) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setBarcode(productToEdit.barcode || '');
        setCategory(productToEdit.category || '');
        setPurchasePrice(productToEdit.purchasePrice.toString());
        setSellingPrice(productToEdit.sellingPrice.toString());
        setQuantity(productToEdit.quantity.toString());
        setMinQuantity(productToEdit.minQuantity.toString());
      } else {
        setName('');
        setBarcode('');
        setCategory('');
        setPurchasePrice('');
        setSellingPrice('');
        setQuantity('');
        setMinQuantity('');
      }
      setError('');
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) return setError('Mahsulot nomi kiritilishi shart');
    const pPrice = Number(purchasePrice);
    const sPrice = Number(sellingPrice);
    const qty = Number(quantity);
    const mQty = Number(minQuantity || 0);

    if (isNaN(pPrice) || pPrice < 0) return setError("Xarid narxi manfiy bo'lishi mumkin emas");
    if (isNaN(sPrice) || sPrice < 0) return setError("Sotuv narxi manfiy bo'lishi mumkin emas");
    if (isNaN(qty) || qty < 0) return setError("Miqdor manfiy bo'lishi mumkin emas");
    if (isNaN(mQty) || mQty < 0) return setError("Minimal miqdor manfiy bo'lishi mumkin emas");

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        category: category.trim() || undefined,
        purchasePrice: pPrice,
        sellingPrice: sPrice,
        quantity: qty,
        minQuantity: mQty,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto transition-all duration-300 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
          {/* Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {productToEdit ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={22} />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-500/20 animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mahsulot nomi <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Package size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Masalan: Qora choy"
                />
              </div>
            </div>

            {/* Barcode & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Barcode (Shtrix-kod)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Barcode size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={barcode} 
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Skanerlang..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Kategoriya</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Tags size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Masalan: Ichimliklar"
                  />
                </div>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-5 sm:gap-6 bg-slate-50 dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Xarid narxi <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <DollarSign size={16} />
                  </div>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={purchasePrice} 
                    onChange={e => setPurchasePrice(e.target.value)}
                    className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-bold transition-all text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Sotuv narxi <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <DollarSign size={16} />
                  </div>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={sellingPrice} 
                    onChange={e => setSellingPrice(e.target.value)}
                    className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-bold transition-all text-sm sm:text-base text-blue-600 dark:text-blue-400"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-2 gap-5 sm:gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Miqdor <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Layers size={18} />
                  </div>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="any"
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Minimal miqdor</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Hash size={18} />
                  </div>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    value={minQuantity} 
                    onChange={e => setMinQuantity(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-6 mt-6 flex justify-end gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold transition-all active:scale-95"
                disabled={isSubmitting}
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Saqlash</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
