import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Plus, AlertCircle, Save, FolderHeart } from 'lucide-react';
import { expenseCategoryService } from '../services/expenseCategoryService';
import type { ExpenseCategory } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (categoryId: string) => void;
}

export const CategoryModal = ({ isOpen, onClose, onSelect }: CategoryModalProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      resetForm();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const cats = await expenseCategoryService.getCategories();
      setCategories(cats);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setNote('');
    setEditingId(null);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await expenseCategoryService.updateCategory(editingId, { name, note });
      } else {
        const newCat = await expenseCategoryService.createCategory({ name, note });
        if (onSelect) {
          onSelect(newCat.id);
          onClose();
          return;
        }
      }
      resetForm();
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setNote(cat.note || '');
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Kategoriyani o\'chirishni xohlaysizmi?')) {
      try {
        await expenseCategoryService.deleteCategory(id);
        if (editingId === id) resetForm();
        await loadCategories();
      } catch (err: any) {
        alert(err.message || 'Xatolik yuz berdi');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-fadeInUp">
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Kategoriyalar</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100 dark:border-red-500/20 animate-shake">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <h3 className="font-bold mb-4 text-slate-800 dark:text-slate-200">
              {editingId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </h3>
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <FolderHeart size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-medium transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Kategoriya nomi"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
                >
                  <Save size={18} />
                  <span>{editingId ? 'Saqlash' : 'Qo\'shish'}</span>
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    Bekor qilish
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* List */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Mavjud kategoriyalar</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <FolderHeart size={32} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Kategoriyalar mavjud emas</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {categories.map(cat => (
                  <li key={cat.id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all shadow-sm group">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {onSelect && (
                        <button 
                          onClick={() => { onSelect(cat.id); onClose(); }}
                          className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 p-2 rounded-lg transition-colors"
                          title="Tanlash"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
