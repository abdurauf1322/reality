import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { customerService } from '../services/customerService';
import type { Customer } from '../types';
import { CustomerModal } from '../components/CustomerModal';

// Component to fetch and show customer stats asynchronously to keep it fast
const CustomerStatsRow = ({ customerId }: { customerId: string }) => {
  const [stats, setStats] = useState({ salesCount: 0, totalAmount: 0, debtAmount: 0 });
  
  useEffect(() => {
    customerService.getCustomerStats(customerId).then(setStats);
  }, [customerId]);

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';

  return (
    <>
      <td className="py-3 px-4 text-center">{stats.salesCount} ta</td>
      <td className="py-3 px-4 text-right font-medium text-orange-600">{formatPrice(stats.debtAmount)}</td>
      <td className="py-3 px-4 text-right text-green-600">{formatPrice(stats.totalAmount)}</td>
    </>
  );
};

const CustomerStatsCard = ({ customerId }: { customerId: string }) => {
  const [stats, setStats] = useState({ salesCount: 0, totalAmount: 0, debtAmount: 0 });
  
  useEffect(() => {
    customerService.getCustomerStats(customerId).then(setStats);
  }, [customerId]);

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';

  return (
    <div className="grid grid-cols-2 gap-2 text-sm mt-3 mb-4">
      <div>
        <span className="text-gray-500 text-xs block">Sotuvlar</span>
        <span className="font-medium">{stats.salesCount} ta</span>
      </div>
      <div>
        <span className="text-gray-500 text-xs block">Qarzdorlik</span>
        <span className="font-medium text-orange-600">{formatPrice(stats.debtAmount)}</span>
      </div>
    </div>
  );
};


const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let data: Customer[];
      if (searchQuery.trim()) {
        data = await customerService.searchCustomers(searchQuery.trim());
      } else {
        data = await customerService.getCustomers();
      }
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(loadCustomers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, loadCustomers]);

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>) => {
    if (customerToEdit) {
      await customerService.updateCustomer(customerToEdit.id, customerData);
    } else {
      await customerService.createCustomer(customerData);
    }
    await loadCustomers();
  };

  const handleDelete = async (id: string) => {
    try {
      await customerService.deleteCustomer(id);
      setDeleteConfirmId(null);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message || "O'chirishda xatolik yuz berdi");
    }
  };

  const openAddModal = () => {
    setCustomerToEdit(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('uz-UZ');

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Qidirish (ism, telefon)..."
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
      ) : customers.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8">
          <Search size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">
            {searchQuery ? 'Mijoz topilmadi' : 'Mijozlar hali mavjud emas'}
          </p>
          <p className="mt-1 text-sm">
            {searchQuery 
              ? `"${searchQuery}" bo'yicha hech qanday mijoz topilmadi.` 
              : "Yangi mijoz qo'shish uchun 'Qo'shish' tugmasini bosing."}
          </p>
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
                  <th className="py-3 px-4 font-medium">Ism</th>
                  <th className="py-3 px-4 font-medium">Telefon</th>
                  <th className="py-3 px-4 font-medium text-center">Sotuvlar soni</th>
                  <th className="py-3 px-4 font-medium text-right">Qarzdorlik</th>
                  <th className="py-3 px-4 font-medium text-right">Umumiy xarid</th>
                  <th className="py-3 px-4 font-medium">Sana</th>
                  <th className="py-3 px-4 font-medium text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-500">{customer.phone || '-'}</td>
                    <CustomerStatsRow customerId={customer.id} />
                    <td className="py-3 px-4 text-gray-500">{formatDate(customer.createdAt)}</td>
                    <td className="py-3 px-4">
                      {deleteConfirmId === customer.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-red-600 font-medium">O'chirasizmi?</span>
                          <button onClick={() => handleDelete(customer.id)} className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-medium">Ha</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs font-medium">Yo'q</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEditModal(customer)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Tahrirlash">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => setDeleteConfirmId(customer.id)} className="text-red-500 hover:text-red-700 transition-colors" title="O'chirish">
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
            {customers.map((customer) => (
              <div key={customer.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                  </div>
                </div>
                
                <CustomerStatsCard customerId={customer.id} />

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  {deleteConfirmId === customer.id ? (
                    <>
                      <span className="text-sm text-red-600 font-medium mr-2">O'chirasizmi?</span>
                      <button onClick={() => handleDelete(customer.id)} className="text-white bg-red-600 px-3 py-1.5 rounded-md text-sm font-medium">Ha</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium">Yo'q</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openEditModal(customer)} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium">
                        <Edit2 size={16} /> Tahrirlash
                      </button>
                      <button onClick={() => setDeleteConfirmId(customer.id)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium">
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

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};

export default Customers;
