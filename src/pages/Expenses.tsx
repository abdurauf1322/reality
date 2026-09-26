import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, FolderOpen, PieChart } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { expenseCategoryService } from '../services/expenseCategoryService';
import type { Expense, ExpenseCategory } from '../types';
import { ExpenseModal } from '../components/ExpenseModal';
import { CategoryModal } from '../components/CategoryModal';

interface ExpenseWithCategory extends Expense {
  categoryName?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, today: 0 });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCats = await expenseCategoryService.getCategories();
      setCategories(allCats);

      const allExp = await expenseService.getExpenses();
      
      const enriched: ExpenseWithCategory[] = allExp.map(e => {
        const cat = allCats.find(c => c.id === e.categoryId);
        return {
          ...e,
          categoryName: cat ? cat.name : 'Noma\'lum kategoriya'
        };
      });

      setExpenses(enriched);
      applyFilters(enriched, searchQuery, categoryFilter, startDate, endDate);
      calculateStats(enriched);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, startDate, endDate]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters(expenses, searchQuery, categoryFilter, startDate, endDate);
  }, [searchQuery, categoryFilter, startDate, endDate, expenses]);

  const applyFilters = (data: ExpenseWithCategory[], search: string, cat: string, start: string, end: string) => {
    let result = data;

    if (cat !== 'all') {
      result = result.filter(e => e.categoryId === cat);
    }

    if (start) {
      const s = new Date(start).getTime();
      result = result.filter(e => new Date(e.date).getTime() >= s);
    }

    if (end) {
      // end date should be inclusive of the whole day.
      const eDate = new Date(end);
      eDate.setHours(23, 59, 59, 999);
      const eTime = eDate.getTime();
      result = result.filter(e => new Date(e.date).getTime() <= eTime);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        (e.categoryName && e.categoryName.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q))
      );
    }

    setFilteredExpenses(result);
  };

  const calculateStats = (data: ExpenseWithCategory[]) => {
    let total = 0;
    let thisMonth = 0;
    let today = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    data.forEach(e => {
      total += e.amount;
      
      const eDate = new Date(e.date);
      if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) {
        thisMonth += e.amount;
      }

      if (e.date.startsWith(todayStr)) {
        today += e.amount;
      }
    });

    setStats({ total, thisMonth, today });
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Ushbu xarajatni o'chirishni xohlaysizmi?")) {
      try {
        await expenseService.deleteExpense(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Xatolik yuz berdi');
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('uz-UZ');

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PieChart className="text-blue-600" /> Xarajatlar
        </h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium flex"
          >
            <FolderOpen size={18} />
            <span>Kategoriyalar</span>
          </button>
          <button
            onClick={() => { setExpenseToEdit(undefined); setIsExpenseModalOpen(true); }}
            className="flex-1 sm:flex-none items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex"
          >
            <Plus size={18} />
            <span>Xarajat qo'shish</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">Jami xarajat</span>
          <span className="text-2xl font-bold text-gray-900">{formatPrice(stats.total)}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">Shu oy xarajati</span>
          <span className="text-2xl font-bold text-orange-600">{formatPrice(stats.thisMonth)}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium mb-1">Bugungi xarajat</span>
          <span className="text-2xl font-bold text-blue-600">{formatPrice(stats.today)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Qidirish (kategoriya, izoh)..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={18}/>
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="all">Barcha kategoriyalar</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-500">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8">
          <PieChart size={48} className="mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900">Hozircha xarajatlar mavjud emas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b z-10 text-gray-600">
                <tr>
                  <th className="py-3 px-4 font-medium">#</th>
                  <th className="py-3 px-4 font-medium">Kategoriya</th>
                  <th className="py-3 px-4 font-medium text-right">Summa</th>
                  <th className="py-3 px-4 font-medium">Izoh</th>
                  <th className="py-3 px-4 font-medium">Sana</th>
                  <th className="py-3 px-4 font-medium text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((exp, index) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{exp.categoryName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-red-600">{formatPrice(exp.amount)}</td>
                    <td className="py-3 px-4 text-gray-600">{exp.note || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => { setExpenseToEdit(exp); setIsExpenseModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-800 transition-colors" 
                          title="Tahrirlash"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-red-500 hover:text-red-700 transition-colors" 
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4">
            {filteredExpenses.map((exp) => (
              <div key={exp.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700 font-medium mb-1">
                      {exp.categoryName}
                    </span>
                    <h3 className="font-bold text-red-600 text-lg">{formatPrice(exp.amount)}</h3>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(exp.date)}</span>
                </div>
                
                {exp.note && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{exp.note}</p>
                )}

                <div className="flex items-center justify-end gap-2 border-t pt-3 mt-3">
                  <button 
                    onClick={() => { setExpenseToEdit(exp); setIsExpenseModalOpen(true); }}
                    className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium"
                  >
                    <Edit2 size={16} /> Tahrirlash
                  </button>
                  <button 
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium"
                  >
                    <Trash2 size={16} /> O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={loadData}
        expenseToEdit={expenseToEdit}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          loadData(); // To refresh category names in expenses if they were edited
        }}
      />
    </div>
  );
};

export default Expenses;
