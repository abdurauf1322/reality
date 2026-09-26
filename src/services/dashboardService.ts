import { db } from '../db/db';
import { customerService } from './customerService';
import { expenseCategoryService } from './expenseCategoryService';
import type { Product, Sale, Debt, Expense, Customer } from '../types';

export interface DashboardData {
  todaySales: number;
  monthSales: number;
  openDebt: number;
  monthExpenses: number;
  todayExpenses: number;
  activeCustomersCount: number;
  totalProductsCount: number;
  
  lowStockProducts: Product[];
  recentSales: Sale[];
  recentDebts: Debt[];
  recentExpenses: (Expense & { categoryName?: string })[];
  
  recentSalesCustomers: Record<string, Customer>;
  recentDebtsCustomers: Record<string, Customer>;
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Sales
    const sales = await db.sales.orderBy('createdAt').reverse().toArray();
    let todaySales = 0;
    let monthSales = 0;
    
    for (const sale of sales) {
      const sDate = new Date(sale.createdAt);
      if (sale.createdAt.startsWith(todayStr)) {
        todaySales += sale.total;
      }
      if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
        monthSales += sale.total;
      }
    }
    const recentSales = sales.slice(0, 10);

    // 2. Debts
    const debts = await db.debts.orderBy('createdAt').reverse().toArray();
    let openDebt = 0;
    const openDebtsArr: Debt[] = [];
    
    for (const debt of debts) {
      if (debt.remainingAmount > 0) {
        openDebt += debt.remainingAmount;
        openDebtsArr.push(debt);
      }
    }
    const recentDebts = openDebtsArr.slice(0, 10);

    // 3. Expenses
    const expenses = await db.expenses.orderBy('date').reverse().toArray();
    let monthExpenses = 0;
    let todayExpenses = 0;

    for (const exp of expenses) {
      const eDate = new Date(exp.date);
      if (exp.date.startsWith(todayStr)) {
        todayExpenses += exp.amount;
      }
      if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) {
        monthExpenses += exp.amount;
      }
    }
    
    const recentExpensesRaw = expenses.slice(0, 10);
    const categories = await expenseCategoryService.getCategories();
    const recentExpenses = recentExpensesRaw.map(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return { ...e, categoryName: cat ? cat.name : "Noma'lum" };
    });

    // 4. Customers
    const activeCustomersCount = await db.customers.filter(c => !c.isArchived).count();

    // 5. Products
    const products = await db.products.toArray();
    const totalProductsCount = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity).sort((a, b) => a.quantity - b.quantity);

    // Fetch customers for recent sales and debts
    const recentSalesCustomers: Record<string, Customer> = {};
    for (const s of recentSales) {
      if (s.customerId && !recentSalesCustomers[s.customerId]) {
        const c = await customerService.getCustomerById(s.customerId);
        if (c) recentSalesCustomers[s.customerId] = c;
      }
    }

    const recentDebtsCustomers: Record<string, Customer> = {};
    for (const d of recentDebts) {
      if (d.customerId && !recentDebtsCustomers[d.customerId]) {
        const c = await customerService.getCustomerById(d.customerId);
        if (c) recentDebtsCustomers[d.customerId] = c;
      }
    }

    return {
      todaySales,
      monthSales,
      openDebt,
      monthExpenses,
      todayExpenses,
      activeCustomersCount,
      totalProductsCount,
      lowStockProducts,
      recentSales,
      recentDebts,
      recentExpenses,
      recentSalesCustomers,
      recentDebtsCustomers
    };
  }
};
