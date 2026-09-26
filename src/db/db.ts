import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Debt, DebtPayment, Expense, ExpenseCategory, Setting } from '../types';

export class CRMDexie extends Dexie {
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  sales!: Table<Sale, string>;
  debts!: Table<Debt, string>;
  debtPayments!: Table<DebtPayment, string>;
  expenses!: Table<Expense, string>;
  expenseCategories!: Table<ExpenseCategory, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('CRMDatabase');
    
    // Previous version for backward compatibility
    this.version(2).stores({
      products: 'id, barcode, name, category',
      customers: 'id, name, phone',
      sales: 'id, customerId, createdAt',
      debts: 'id, customerId, saleId',
      expenses: 'id, category, createdAt',
      settings: 'key'
    });

    // New version for Phase 5
    this.version(3).stores({
      debts: 'id, saleId, customerId, status, createdAt',
      debtPayments: 'id, debtId, customerId, createdAt'
    }).upgrade(async (tx) => {
      await tx.table('debts').toCollection().modify((debt: any) => {
        if (!debt.status) {
          debt.originalAmount = debt.amount || 0;
          debt.status = debt.remainingAmount === 0 ? 'paid' : (debt.paidAmount > 0 ? 'partial' : 'unpaid');
          delete debt.amount;
        }
      });
    });

    // New version for Phase 6
    this.version(4).stores({
      expenses: 'id, categoryId, date, createdAt',
      expenseCategories: 'id, name, createdAt'
    }).upgrade(async (tx) => {
      // Migrate old expenses to use a category
      const oldExpenses = await tx.table('expenses').toArray();
      const hasOldExpenses = oldExpenses.some(e => !e.categoryId);
      if (hasOldExpenses) {
        const defaultCatId = crypto.randomUUID();
        await tx.table('expenseCategories').add({
          id: defaultCatId,
          name: 'Boshqa',
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        await tx.table('expenses').toCollection().modify((expense: any) => {
          if (!expense.categoryId) {
            expense.categoryId = defaultCatId;
            expense.date = expense.createdAt;
            expense.updatedAt = expense.createdAt;
            delete expense.title;
            delete expense.category;
          }
        });
      }
    });

    // New version for bugfix
    this.version(5).stores({
      products: 'id, barcode, name, category, createdAt'
    });
  }
}

export const db = new CRMDexie();
