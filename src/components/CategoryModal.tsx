import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Plus } from 'lucide-react';
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h2 className="text-xl font-semibold">Kategoriyalar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="mb-6 bg-gray-50 p-3 rounded border">
            <h3 className="font-medium mb-3 text-sm text-gray-700">
              {editingId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </h3>
            <div className="space-y-3">
              <div>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Kategoriya nomi"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  {editingId ? 'Saqlash' : 'Qo\'shish'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                  >
                    Bekor qilish
                  </button>
                )}
              </div>
            </div>
          </form>

          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-2">Mavjud kategoriyalar</h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Kategoriyalar mavjud emas</p>
            ) : (
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id} className="flex justify-between items-center p-2 hover:bg-gray-50 border rounded-md">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <div className="flex gap-1">
                      {onSelect && (
                        <button 
                          onClick={() => { onSelect(cat.id); onClose(); }}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded"
                          title="Tanlash"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded"
                      >
                        <Trash2 size={16} />
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
