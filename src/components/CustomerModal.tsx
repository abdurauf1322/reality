import { useState, useEffect } from 'react';
import type { Customer } from '../types';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {customerToEdit ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mijoz ismi *</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masalan: Alisher Navoiy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (ixtiyoriy)</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+998 90 123 45 67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
