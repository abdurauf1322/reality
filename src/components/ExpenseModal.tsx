import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              {expenseToEdit ? 'Xarajatni tahrirlash' : 'Xarajat qo\'shish'}
            </h2>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya *</label>
              <div className="flex gap-2">
                <select 
                  required
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Kategoriya tanlang</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  title="Yangi kategoriya"
                >
                  <Plus size={18}/>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summa *</label>
              <input 
                type="number"
                min="1"
                required
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sana *</label>
              <input 
                type="date"
                required
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
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
