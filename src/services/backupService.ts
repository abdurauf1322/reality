import { db } from '../db/db';
import type { 
  Product, 
  Sale, 
  Customer, 
  Debt, 
  DebtPayment, 
  Expense, 
  ExpenseCategory 
} from '../types';

export interface CRMBackup {
  schemaVersion: number;
  appVersion?: string;
  exportedAt: string;
  data: {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
    debts: Debt[];
    debtPayments: DebtPayment[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
  };
}

export const CURRENT_BACKUP_VERSION = 1;

export const backupService = {
  async exportBackup(): Promise<Blob> {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const debts = await db.debts.toArray();
    const debtPayments = await db.debtPayments.toArray();
    const expenses = await db.expenses.toArray();
    const expenseCategories = await db.expenseCategories.toArray();

    const backupData: CRMBackup = {
      schemaVersion: CURRENT_BACKUP_VERSION,
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        products,
        sales,
        customers,
        debts,
        debtPayments,
        expenses,
        expenseCategories
      }
    };

    const json = JSON.stringify(backupData, null, 2);
    return new Blob([json], { type: 'application/json' });
  },

  async validateBackup(fileContent: string): Promise<CRMBackup> {
    let parsed: any;
    try {
      parsed = JSON.parse(fileContent);
    } catch (err) {
      throw new Error("Backup fayli noto'g'ri formatda (Yaroqsiz JSON).");
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Backup formati noto'g'ri (JSON object emas).");
    }

    if (!parsed.schemaVersion) {
      throw new Error("schemaVersion topilmadi.");
    }

    if (parsed.schemaVersion > CURRENT_BACKUP_VERSION) {
      throw new Error(`Ushbu backup versiyasi (${parsed.schemaVersion}) qo'llab-quvvatlanmaydi. Dasturni yangilash kerak bo'lishi mumkin.`);
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      throw new Error("Ma'lumotlar topilmadi (data obyekti yo'q).");
    }

    const { products, sales, customers, debts, debtPayments, expenses, expenseCategories } = parsed.data;

    const arrFields = { products, sales, customers, debts, debtPayments, expenses, expenseCategories };
    for (const [key, val] of Object.entries(arrFields)) {
      if (!Array.isArray(val)) {
        throw new Error(`'${key}' ro'yxati noto'g'ri shaklda.`);
      }
    }

    // Checking IDs
    const idSet = new Set<string>();
    const checkIds = (arr: any[], entityName: string) => {
      for (const item of arr) {
        if (!item.id || typeof item.id !== 'string') {
          throw new Error(`${entityName} ichida ID yo'q yoki yaroqsiz record topildi.`);
        }
        if (idSet.has(item.id)) {
          throw new Error(`Backup ichida duplicate ID topildi: ${item.id}`);
        }
        idSet.add(item.id);
      }
    };

    checkIds(products, 'Products');
    checkIds(sales, 'Sales');
    checkIds(customers, 'Customers');
    checkIds(debts, 'Debts');
    checkIds(debtPayments, 'DebtPayments');
    checkIds(expenses, 'Expenses');
    checkIds(expenseCategories, 'ExpenseCategories');

    // Basic Structure validations
    for (const p of products) {
      if (!p.name || typeof p.sellingPrice !== 'number' || typeof p.quantity !== 'number') {
        throw new Error(`Mahsulot (${p.id}) formati noto'g'ri.`);
      }
    }

    for (const c of customers) {
      if (!c.name) {
        throw new Error(`Mijoz (${c.id}) formati noto'g'ri.`);
      }
    }

    for (const s of sales) {
      if (!['cash', 'card', 'debt'].includes(s.paymentType)) {
        throw new Error(`Sale (${s.id}) da noto'g'ri paymentType: ${s.paymentType}`);
      }
      if (!Array.isArray(s.items)) {
        throw new Error(`Sale (${s.id}) da items yo'q.`);
      }
      for (const item of s.items) {
        if (!item.productId || typeof item.quantity !== 'number') {
          throw new Error(`Sale (${s.id}) ichidagi item formati noto'g'ri.`);
        }
      }
    }

    for (const d of debts) {
      if (!['unpaid', 'partial', 'paid'].includes(d.status)) {
        throw new Error(`Debt (${d.id}) da noto'g'ri status: ${d.status}`);
      }
      if (typeof d.remainingAmount !== 'number') {
        throw new Error(`Debt (${d.id}) formati noto'g'ri.`);
      }
    }

    for (const dp of debtPayments) {
      if (!['cash', 'card'].includes(dp.paymentType)) {
        throw new Error(`DebtPayment (${dp.id}) da noto'g'ri paymentType: ${dp.paymentType}`);
      }
    }

    for (const e of expenses) {
      if (!e.categoryId || typeof e.amount !== 'number' || !e.date) {
        throw new Error(`Expense (${e.id}) formati noto'g'ri.`);
      }
    }

    for (const ec of expenseCategories) {
      if (!ec.name) {
        throw new Error(`ExpenseCategory (${ec.id}) nomi yo'q.`);
      }
    }

    // Relationship Validation
    const pIds = new Set(products.map((x: Product) => x.id));
    const cIds = new Set(customers.map((x: Customer) => x.id));
    const sIds = new Set(sales.map((x: Sale) => x.id));
    const ecIds = new Set(expenseCategories.map((x: ExpenseCategory) => x.id));
    const dIds = new Set(debts.map((x: Debt) => x.id));

    for (const s of sales) {
      if (s.customerId && !cIds.has(s.customerId)) {
        throw new Error(`Sale (${s.id}) ga tegishli mijoz topilmadi.`);
      }
      for (const item of s.items) {
        if (!pIds.has(item.productId)) {
          throw new Error(`Sale (${s.id}) ichidagi mahsulot (${item.productId}) topilmadi.`);
        }
      }
    }

    for (const d of debts) {
      if (!sIds.has(d.saleId)) {
        throw new Error(`Debt (${d.id}) ga tegishli savdo (Sale) topilmadi.`);
      }
      if (d.customerId && !cIds.has(d.customerId)) {
        throw new Error(`Debt (${d.id}) ga tegishli mijoz topilmadi.`);
      }
    }

    for (const dp of debtPayments) {
      if (!dIds.has(dp.debtId)) {
        throw new Error(`DebtPayment (${dp.id}) ga tegishli qarz (Debt) topilmadi.`);
      }
      if (dp.customerId && !cIds.has(dp.customerId)) {
        throw new Error(`DebtPayment (${dp.id}) ga tegishli mijoz topilmadi.`);
      }
    }

    for (const e of expenses) {
      if (!ecIds.has(e.categoryId)) {
        throw new Error(`Expense (${e.id}) ga tegishli kategoriya topilmadi.`);
      }
    }

    return parsed as CRMBackup;
  },

  async restoreBackup(backup: CRMBackup): Promise<void> {
    const { products, sales, customers, debts, debtPayments, expenses, expenseCategories } = backup.data;

    await db.transaction('rw', 
      [
        db.products, 
        db.sales, 
        db.customers, 
        db.debts, 
        db.debtPayments, 
        db.expenses, 
        db.expenseCategories
      ], 
      async () => {
        // Clear all tables
        await db.products.clear();
        await db.sales.clear();
        await db.customers.clear();
        await db.debts.clear();
        await db.debtPayments.clear();
        await db.expenses.clear();
        await db.expenseCategories.clear();

        // Add all from backup
        await db.products.bulkAdd(products);
        await db.sales.bulkAdd(sales);
        await db.customers.bulkAdd(customers);
        await db.debts.bulkAdd(debts);
        await db.debtPayments.bulkAdd(debtPayments);
        await db.expenses.bulkAdd(expenses);
        await db.expenseCategories.bulkAdd(expenseCategories);
    });
  }
};
