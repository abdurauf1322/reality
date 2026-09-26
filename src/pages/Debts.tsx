import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, AlertCircle, HandCoins } from 'lucide-react';
import { debtService } from '../services/debtService';
import { customerService } from '../services/customerService';
import type { Debt, Customer } from '../types';
import { DebtDetailModal } from '../components/DebtModals';

interface DebtWithCustomer extends Debt {
  customer?: Customer;
}

const Debts = () => {
  const [debts, setDebts] = useState<DebtWithCustomer[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<DebtWithCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Stats
  const [stats, setStats] = useState({ totalDebtAmount: 0, totalUnpaidCount: 0, totalPartialCount: 0, totalPaidCount: 0 });

  // Detail Modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load debts and stats
      const allDebts = await debtService.getDebts();
      const currentStats = await debtService.getDebtStats();
      setStats(currentStats);

      // We need to attach customers to debts for filtering
      const enrichedDebts: DebtWithCustomer[] = [];
      for (const d of allDebts) {
        const c = await customerService.getCustomerById(d.customerId);
        enrichedDebts.push({ ...d, customer: c });
      }
      
      setDebts(enrichedDebts);
      applyFilters(enrichedDebts, searchQuery, statusFilter);
      
      // Update selected debt if modal is open
      if (selectedDebt) {
        const updated = await debtService.getDebtById(selectedDebt.id);
        if (updated) setSelectedDebt(updated);
      }
    } catch (err: any) {
      setError(err.message || "Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, selectedDebt]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters(debts, searchQuery, statusFilter);
  }, [searchQuery, statusFilter, debts]);

  const applyFilters = (data: DebtWithCustomer[], search: string, status: string) => {
    let result = data;

    if (status !== 'all') {
      result = result.filter(d => d.status === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d => 
        (d.customer?.name && d.customer.name.toLowerCase().includes(q)) ||
        (d.customer?.phone && d.customer.phone.toLowerCase().includes(q))
      );
    }

    setFilteredDebts(result);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' UZS';
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('uz-UZ');

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HandCoins className="text-blue-600" /> Qarzdorlik
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">Jami ochiq qarz (so'm)</span>
          <span className="text-2xl font-bold text-orange-600 truncate">{formatPrice(stats.totalDebtAmount).replace(' UZS', '')}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">To'lanmagan</span>
          <span className="text-2xl font-bold text-red-600">{stats.totalUnpaidCount} ta</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">Qisman to'langan</span>
          <span className="text-2xl font-bold text-orange-500">{stats.totalPartialCount} ta</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">To'liq to'langan</span>
          <span className="text-2xl font-bold text-green-600">{stats.totalPaidCount} ta</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Mijoz izlash (ism yoki telefon)..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" size={20}/>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Barchasi</option>
            <option value="unpaid">To'lanmagan</option>
            <option value="partial">Qisman to'langan</option>
            <option value="paid">To'langan</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8">
          <HandCoins size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">Qarzlar mavjud emas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b z-10 text-gray-600">
                <tr>
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Mijoz</th>
                  <th className="py-3 px-4 font-medium text-right">Qarz</th>
                  <th className="py-3 px-4 font-medium text-right">To'langan</th>
                  <th className="py-3 px-4 font-medium text-right">Qolgan</th>
                  <th className="py-3 px-4 font-medium center">Status</th>
                  <th className="py-3 px-4 font-medium">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDebts.map((debt, index) => (
                  <tr 
                    key={debt.id} 
                    onClick={() => setSelectedDebt(debt)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {debt.customer ? debt.customer.name : 'Noma\'lum'}
                      {debt.customer?.phone && <span className="block text-xs text-gray-500 font-normal">{debt.customer.phone}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatPrice(debt.originalAmount)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatPrice(debt.paidAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-orange-600">{formatPrice(debt.remainingAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        debt.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                        debt.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {debt.status === 'unpaid' ? 'To\'lanmagan' : debt.status === 'partial' ? 'Qisman' : 'To\'langan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(debt.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
            {filteredDebts.map((debt) => (
              <div 
                key={debt.id} 
                onClick={() => setSelectedDebt(debt)}
                className="bg-white border rounded-lg p-4 shadow-sm active:bg-blue-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{debt.customer ? debt.customer.name : 'Noma\'lum'}</h3>
                    {debt.customer?.phone && <p className="text-xs text-gray-500">{debt.customer.phone}</p>}
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    debt.status === 'unpaid' ? 'bg-red-100 text-red-800' :
                    debt.status === 'partial' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {debt.status === 'unpaid' ? 'To\'lanmagan' : debt.status === 'partial' ? 'Qisman' : 'To\'langan'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-gray-500 text-xs block">Asosiy qarz</span>
                    <span className="font-medium">{formatPrice(debt.originalAmount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">To'langan</span>
                    <span className="font-medium text-green-600">{formatPrice(debt.paidAmount)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t mt-1">
                    <span className="text-gray-500 text-xs block">Qolgan qarz</span>
                    <span className="font-bold text-orange-600 text-lg">{formatPrice(debt.remainingAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDebt && (
        <DebtDetailModal
          debt={selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default Debts;
