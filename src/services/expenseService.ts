import { db } from '../db/db';
import type { Expense } from '../types';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    return await db.expenses.orderBy('date').reverse().toArray();
  },

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return await db.expenses.get(id);
  },

  async createExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    if (expenseData.amount <= 0) {
      throw new Error("Summa 0 dan katta bo'lishi kerak.");
    }
    
    if (isNaN(new Date(expenseData.date).getTime())) {
      throw new Error("Sana noto'g'ri.");
    }

    const category = await db.expenseCategories.get(expenseData.categoryId);
    if (!category) {
      throw new Error("Kategoriya topilmadi.");
    }

    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    await db.expenses.add(newExpense);
    return newExpense;
  },

  async updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> {
    const existing = await db.expenses.get(id);
    if (!existing) {
      throw new Error("Xarajat topilmadi.");
    }

    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error("Summa 0 dan katta bo'lishi kerak.");
    }

    if (updates.date !== undefined && isNaN(new Date(updates.date).getTime())) {
      throw new Error("Sana noto'g'ri.");
    }

    if (updates.categoryId !== undefined) {
      const category = await db.expenseCategories.get(updates.categoryId);
      if (!category) {
        throw new Error("Kategoriya topilmadi.");
      }
    }

    const updatedExpense = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.expenses.put(updatedExpense);
    return updatedExpense;
  },

  async deleteExpense(id: string): Promise<void> {
    const existing = await db.expenses.get(id);
    if (!existing) {
      throw new Error("Xarajat topilmadi.");
    }
    await db.expenses.delete(id);
  },

  async getExpensesByCategory(categoryId: string): Promise<Expense[]> {
    return await db.expenses.where('categoryId').equals(categoryId).reverse().sortBy('date');
  },

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return await db.expenses
      .where('date')
      .between(startDate, endDate)
      .reverse()
      .sortBy('date');
  },

  async getTotalExpenses(): Promise<number> {
    const expenses = await db.expenses.toArray();
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  },

  async getTotalExpensesByCategory(categoryId: string): Promise<number> {
    const expenses = await this.getExpensesByCategory(categoryId);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }
};
