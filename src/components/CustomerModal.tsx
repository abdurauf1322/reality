import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import { X, AlertCircle, Save, User, Phone, AlignLeft } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>) => Promise<void>;
  customerToEdit?: Customer;
}

export const CustomerModal = ({ isOpen, onClose, onSave, customerToEdit }: CustomerModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name);
        setPhone(customerToEdit.phone || '');
        setNote(customerToEdit.note || '');
      } else {
        setName('');
        setPhone('');
        setNote('');
      }
      setError('');
    }
  }, [isOpen, customerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      return setError('Mijoz ismi kiritilishi shart');
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: trimmedName,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
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
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md my-8 overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
          {/* Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              {customerToEdit ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"}
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mijoz ismi <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Masalan: Alisher Navoiy"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Telefon (ixtiyoriy)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Phone size={18} />
                </div>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="+998 90 123 45 67"
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
                  rows={3}
                />
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
