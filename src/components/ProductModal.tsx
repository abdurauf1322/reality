import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {productToEdit ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulot nomi *</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masalan: Qora choy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Shtrix-kod)</label>
            <input 
              type="text" 
              value={barcode} 
              onChange={e => setBarcode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Skanerlang yoki kiriting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
            <input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masalan: Ichimliklar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xarid narxi * (UZS)</label>
              <input 
                type="number" 
                required
                min="0"
                value={purchasePrice} 
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sotuv narxi * (UZS)</label>
              <input 
                type="number" 
                required
                min="0"
                value={sellingPrice} 
                onChange={e => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miqdor *</label>
              <input 
                type="number" 
                required
                min="0"
                step="any"
                value={quantity} 
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimal miqdor</label>
              <input 
                type="number" 
                min="0"
                step="any"
                value={minQuantity} 
                onChange={e => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
