import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { productService } from '../services/productService';
import type { Product } from '../types';
import { StockStatus } from '../components/StockStatus';
import { ProductModal } from '../components/ProductModal';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let data: Product[];
      if (searchQuery.trim()) {
        data = await productService.searchProducts(searchQuery.trim());
      } else {
        data = await productService.getProducts();
      }
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (productToEdit) {
      await productService.updateProduct(productToEdit.id, productData);
    } else {
      await productService.createProduct(productData);
    }
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setDeleteConfirmId(null);
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "O'chirishda xatolik yuz berdi");
    }
  };

  const openAddModal = () => {
    setProductToEdit(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Qidirish..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Qo'shish</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8">
          <Search size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">
            {searchQuery ? 'Topilmadi' : 'Mahsulotlar hali mavjud emas'}
          </p>
          <p className="mt-1 text-sm">
            {searchQuery 
              ? `"${searchQuery}" bo'yicha hech qanday mahsulot topilmadi.` 
              : "Yangi mahsulot qo'shish uchun 'Qo'shish' tugmasini bosing."}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={20} /> Mahsulot qo'shish
            </button>
          )}
        </div>
      ) : (
        /* Data View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Mahsulot nomi</th>
                  <th className="py-3 px-4 font-medium">Barcode</th>
                  <th className="py-3 px-4 font-medium">Kategoriya</th>
                  <th className="py-3 px-4 font-medium text-right">Xarid narxi</th>
                  <th className="py-3 px-4 font-medium text-right">Sotuv narxi</th>
                  <th className="py-3 px-4 font-medium text-right">Miqdor</th>
                  <th className="py-3 px-4 font-medium center">Holat</th>
                  <th className="py-3 px-4 font-medium text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-gray-500">{product.barcode || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{product.category || '-'}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatPrice(product.purchasePrice)}</td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">{formatPrice(product.sellingPrice)}</td>
                    <td className="py-3 px-4 text-right">{product.quantity}</td>
                    <td className="py-3 px-4">
                      <StockStatus quantity={product.quantity} minQuantity={product.minQuantity} />
                    </td>
                    <td className="py-3 px-4">
                      {deleteConfirmId === product.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-red-600 font-medium">O'chirasizmi?</span>
                          <button onClick={() => handleDelete(product.id)} className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium">Ha</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs font-medium">Yo'q</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Tahrirlash">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(product.id)} className="text-red-500 hover:text-red-700 transition-colors" title="O'chirish">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.barcode && <p className="text-xs text-gray-500">{product.barcode}</p>}
                  </div>
                  <StockStatus quantity={product.quantity} minQuantity={product.minQuantity} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3 mb-4">
                  <div>
                    <span className="text-gray-500 text-xs block">Sotuv narxi</span>
                    <span className="font-medium">{formatPrice(product.sellingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Miqdor</span>
                    <span>{product.quantity} ta</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  {deleteConfirmId === product.id ? (
                    <>
                      <span className="text-sm text-red-600 font-medium mr-2">O'chirasizmi?</span>
                      <button onClick={() => handleDelete(product.id)} className="text-white bg-red-600 px-3 py-1.5 rounded-md text-sm font-medium">Ha</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">Yo'q</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openEditModal(product)} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium">
                        <Edit2 size={16} /> Tahrirlash
                      </button>
                      <button onClick={() => setDeleteConfirmId(product.id)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium">
                        <Trash2 size={16} /> O'chirish
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />
    </div>
  );
};

export default Products;
