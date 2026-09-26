import { useState, useEffect } from 'react';
import { X, Receipt, Trash2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Qarz uzish</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm mb-4">
            Qolgan qarz: <strong>{new Intl.NumberFormat('uz-UZ').format(debt.remainingAmount)} UZS</strong>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To'lov summasi *</label>
            <input 
              type="number"
              min="1"
              max={debt.remainingAmount}
              required
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To'lov turi</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setPaymentType('cash')}
                className={`py-2 rounded border font-medium ${paymentType === 'cash' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              >
                Naqd
              </button>
              <button 
                type="button"
                onClick={() => setPaymentType('card')}
                className={`py-2 rounded border font-medium ${paymentType === 'card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
              >
                Karta
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Qo'shimcha ma'lumot..."
              rows={2}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Bekor qilish
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saqlanmoqda...' : "To'lovni saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt size={24} className="text-blue-600"/> Qarz Tafsilotlari
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-gray-50 rounded-lg p-4 border mb-6">
            <h3 className="font-bold text-lg mb-4">Mijoz: {customerName}</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Asosiy qarz</p>
                <p className="font-semibold">{formatPrice(debt.originalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">To'langan</p>
                <p className="font-semibold text-green-600">{formatPrice(debt.paidAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Qolgan</p>
                <p className="font-bold text-orange-600 text-lg">{formatPrice(debt.remainingAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium mt-1 ${
                  debt.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                  debt.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {debt.status === 'unpaid' ? 'To\'lanmagan' : debt.status === 'partial' ? 'Qisman to\'langan' : 'To\'langan'}
                </span>
              </div>
            </div>

            {debt.remainingAmount > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors shadow-sm"
              >
                Qarz uzish
              </button>
            )}
          </div>

          <h3 className="font-bold text-lg mb-3">To'lovlar tarixi</h3>
          
          {payments.length === 0 ? (
            <div className="text-center p-6 text-gray-500 border rounded-lg bg-gray-50">
              Hali to'lovlar amalga oshirilmagan
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 border-b">
                  <tr>
                    <th className="py-2 px-4 font-medium">Sana</th>
                    <th className="py-2 px-4 font-medium text-right">Summa</th>
                    <th className="py-2 px-4 font-medium text-center">Turi</th>
                    <th className="py-2 px-4 font-medium">Izoh</th>
                    <th className="py-2 px-4 font-medium text-center">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{formatDate(p.createdAt)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">+{formatPrice(p.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                          {p.paymentType === 'cash' ? 'Naqd' : 'Karta'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{p.note || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleDeletePayment(p.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                          title="O'chirish"
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
    </div>
  );
};
