import { useState, useEffect } from 'react';
import { X, Receipt, Trash2, AlertCircle, CreditCard, AlignLeft, Wallet, CheckCircle2, User } from 'lucide-react';
import { debtService } from '../services/debtService';
import type { Debt, DebtPayment } from '../types';
import { customerService } from '../services/customerService';

interface PaymentModalProps {
  debt: Debt;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal = ({ debt, onClose, onSuccess }: PaymentModalProps) => {
  const [amount, setAmount] = useState<string>(debt.remainingAmount.toString());
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError("To'lov summasi noldan katta bo'lishi kerak.");
    }
    if (parsedAmount > debt.remainingAmount) {
      return setError("To'lov summasi qolgan qarzdan katta bo'lishi mumkin emas.");
    }

    setIsSubmitting(true);
    try {
      await debtService.addDebtPayment(debt.id, {
        amount: parsedAmount,
        paymentType,
        note: note.trim() || undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
          
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              Qarz uzish
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={22} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-500/20 animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 p-4 rounded-2xl text-sm font-medium border border-orange-100 dark:border-orange-500/20 flex items-center gap-3">
              <Wallet size={20} className="shrink-0" />
              <div>
                <p className="text-orange-600/80 dark:text-orange-400/80 text-xs uppercase tracking-wider mb-0.5">Qolgan qarz</p>
                <p className="text-lg font-bold">{new Intl.NumberFormat('uz-UZ').format(debt.remainingAmount)} UZS</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">To'lov summasi <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <CreditCard size={18} />
                </div>
                <input 
                  type="number"
                  min="1"
                  max={debt.remainingAmount}
                  required
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-lg font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">To'lov turi</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-3 rounded-2xl border-2 font-bold transition-all active:scale-95 ${paymentType === 'cash' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-500' : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  Naqd
                </button>
                <button 
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`py-3 rounded-2xl border-2 font-bold transition-all active:scale-95 ${paymentType === 'card' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-500' : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  Karta
                </button>
              </div>
            </div>

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

            <div className="pt-2 mt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all active:scale-95"
                disabled={isSubmitting}
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                className="flex-[2] flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40 text-white py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>To'lovni saqlash</span>
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

interface DebtDetailModalProps {
  debt: Debt;
  onClose: () => void;
  onUpdate: () => void;
}

export const DebtDetailModal = ({ debt, onClose, onUpdate }: DebtDetailModalProps) => {
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [customerName, setCustomerName] = useState('Yuklanmoqda...');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    customerService.getCustomerById(debt.customerId).then(c => {
      setCustomerName(c ? c.name : 'Noma\'lum mijoz');
    });
    loadPayments();
  }, [debt]);

  const loadPayments = async () => {
    const p = await debtService.getDebtPayments(debt.id);
    setPayments(p);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm("Ushbu to'lovni o'chirishni xohlaysizmi? Qarz summasi qayta hisoblanadi.")) {
      try {
        await debtService.deleteDebtPayment(paymentId);
        onUpdate();
        loadPayments();
      } catch (err: any) {
        alert(err.message || 'Xatolik yuz berdi');
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  const formatDate = (isoString: string) => new Date(isoString).toLocaleString('uz-UZ');

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget && !showPaymentModal) onClose();
        }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
          
          {/* Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Receipt size={24} />
              </div>
              Qarz Tafsilotlari
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={22} />
            </button>
          </div>
          
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Debt Overview Card */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Receipt size={100} />
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2">
                <User size={18} className="text-slate-400" />
                Mijoz: <span className="text-blue-600 dark:text-blue-400">{customerName}</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Asosiy qarz</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{formatPrice(debt.originalAmount)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">To'langan</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(debt.paidAmount)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-orange-100 dark:border-orange-500/30 shadow-sm shadow-orange-500/10">
                  <p className="text-xs font-medium text-orange-600/80 dark:text-orange-400/80 mb-1 uppercase tracking-wider">Qolgan</p>
                  <p className="font-black text-orange-600 dark:text-orange-400 text-lg">{formatPrice(debt.remainingAmount)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Status</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                    debt.status === 'unpaid' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    debt.status === 'partial' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {debt.status === 'unpaid' ? 'To\'lanmagan' : debt.status === 'partial' ? 'Qisman' : 'To\'langan'}
                  </span>
                </div>
              </div>

              {debt.remainingAmount > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-600/40 active:scale-95"
                >
                  <Wallet size={18} />
                  Qarz uzish
                </button>
              )}
            </div>

            {/* Payments History */}
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <AlignLeft size={20} className="text-slate-400" /> To'lovlar tarixi
              </h3>
              
              {payments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <CreditCard size={32} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Hali to'lovlar amalga oshirilmagan</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Sana</th>
                        <th className="py-3 px-4 font-semibold text-right">Summa</th>
                        <th className="py-3 px-4 font-semibold text-center">Turi</th>
                        <th className="py-3 px-4 font-semibold">Izoh</th>
                        <th className="py-3 px-4 font-semibold text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{formatDate(p.createdAt)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">+{formatPrice(p.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              {p.paymentType === 'cash' ? 'Naqd' : 'Karta'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs max-w-[150px] truncate" title={p.note || ''}>
                            {p.note || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="To'lovni bekor qilish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <PaymentModal
          debt={debt}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            onUpdate(); // Reload debt in parent
            loadPayments();
          }}
        />
      )}
    </>
  );
};
