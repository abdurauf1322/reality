import { useState, useEffect } from 'react';
import { X, Plus, FolderHeart, CreditCard, Calendar, AlignLeft, AlertCircle, Save } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { expenseCategoryService } from '../services/expenseCategoryService';
import type { Expense, ExpenseCategory } from '../types';
import { CategoryModal } from './CategoryModal';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense;
}

export const ExpenseModal = ({ isOpen, onClose, onSuccess, expenseToEdit }: ExpenseModalProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (expenseToEdit) {
        setCategoryId(expenseToEdit.categoryId);
        setAmount(expenseToEdit.amount.toString());
        setDate(expenseToEdit.date.split('T')[0]);
        setNote(expenseToEdit.note || '');
      } else {
        setCategoryId('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setError('');
    }
  }, [isOpen, expenseToEdit]);

  const loadCategories = async () => {
    try {
      const cats = await expenseCategoryService.getCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
      return setError('Kategoriya tanlang.');
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError('Summa 0 dan katta bo\'lishi kerak.');
    }

    if (!date) {
      return setError('Sana noto\'g\'ri.');
    }

    setIsSubmitting(true);
    try {
      // Need full ISO string for date if possible, but YYYY-MM-DD is fine for grouping
      const isoDate = new Date(date).toISOString();

      if (expenseToEdit) {
        await expenseService.updateExpense(expenseToEdit.id, {
          categoryId,
          amount: parsedAmount,
          date: isoDate,
          note: note.trim() || undefined
        });
      } else {
        await expenseService.createExpense({
          categoryId,
          amount: parsedAmount,
          date: isoDate,
          note: note.trim() || undefined
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = async (id: string) => {
    await loadCategories();
    setCategoryId(id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Content */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
          
          {/* Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {expenseToEdit ? 'Xarajatni tahrirlash' : 'Yangi xarajat qo\'shish'}
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
            
            {/* Category Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Kategoriya <span className="text-red-500">*</span></label>
              <div className="flex shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800/50">
                <div className="pl-4 pr-2 flex items-center text-slate-400 dark:text-slate-500">
                  <FolderHeart size={18} />
                </div>
                <select 
                  required
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="flex-1 py-3.5 px-2 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer font-medium"
                >
                  <option value="" disabled>Kategoriya tanlang...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-200">{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-4 sm:px-5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors border-l border-slate-200 dark:border-slate-700 flex items-center justify-center font-medium group"
                  title="Yangi kategoriya qo'shish"
                >
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Summa <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <CreditCard size={20} />
                </div>
                <input 
                  type="number"
                  min="1"
                  required
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-12 pr-16 py-4 text-lg font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
                  placeholder="0"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  so'm
                </div>
              </div>
            </div>

            {/* Date & Note Grid */}
            <div className="grid grid-cols-1 gap-5 sm:gap-6">
              {/* Date Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Sana <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input 
                    type="date"
                    required
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all"
                  />
                </div>
              </div>

              {/* Note Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Izoh (ixtiyoriy)</label>
                <div className="relative group">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <AlignLeft size={18} />
                  </div>
                  <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    placeholder="Qo'shimcha ma'lumotlar..."
                    rows={2}
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

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelect}
      />
    </>
  );
};
