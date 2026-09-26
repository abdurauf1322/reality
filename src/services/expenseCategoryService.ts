import { db } from '../db/db';
import type { ExpenseCategory } from '../types';

export const expenseCategoryService = {
  async getCategories(): Promise<ExpenseCategory[]> {
    return await db.expenseCategories
      .filter(c => !c.isArchived)
      .reverse()
      .sortBy('createdAt');
  },

  async getCategoryById(id: string): Promise<ExpenseCategory | undefined> {
    return await db.expenseCategories.get(id);
  },

  async createCategory(categoryData: { name: string; note?: string }): Promise<ExpenseCategory> {
    const trimmedName = categoryData.name.trim();
    if (!trimmedName) {
      throw new Error("Kategoriya nomi bo'sh bo'lishi mumkin emas.");
    }

    const lowerQuery = trimmedName.toLowerCase();
    
    // Validate uniqueness (case-insensitive) across active categories
    const existing = await db.expenseCategories
      .filter(c => !c.isArchived && c.name.toLowerCase() === lowerQuery)
      .first();

    if (existing) {
      throw new Error("Bu kategoriya allaqachon mavjud.");
    }

    const now = new Date().toISOString();
    const newCat: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: trimmedName,
      note: categoryData.note?.trim() || undefined,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.expenseCategories.add(newCat);
    return newCat;
  },

  async updateCategory(id: string, updates: { name?: string; note?: string }): Promise<ExpenseCategory> {
    const existingCat = await db.expenseCategories.get(id);
    if (!existingCat) {
      throw new Error("Kategoriya topilmadi.");
    }

    let updatedName = existingCat.name;

    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName) {
        throw new Error("Kategoriya nomi bo'sh bo'lishi mumkin emas.");
      }
      
      if (trimmedName.toLowerCase() !== existingCat.name.toLowerCase()) {
        const lowerQuery = trimmedName.toLowerCase();
        const existingDuplicate = await db.expenseCategories
          .filter(c => !c.isArchived && c.id !== id && c.name.toLowerCase() === lowerQuery)
          .first();

        if (existingDuplicate) {
          throw new Error("Bu kategoriya allaqachon mavjud.");
        }
      }
      updatedName = trimmedName;
    }

    const updatedCat = {
      ...existingCat,
      name: updatedName,
      note: updates.note !== undefined ? updates.note.trim() : existingCat.note,
      updatedAt: new Date().toISOString(),
    };

    await db.expenseCategories.put(updatedCat);
    return updatedCat;
  },

  async deleteCategory(id: string): Promise<void> {
    return await db.transaction('rw', db.expenses, db.expenseCategories, async () => {
      const existing = await db.expenseCategories.get(id);
      if (!existing) {
        throw new Error("Kategoriya topilmadi.");
      }

      // Check if used in expenses
      const usedCount = await db.expenses.where('categoryId').equals(id).count();

      if (usedCount > 0) {
        // Soft delete
        await db.expenseCategories.update(id, {
          isArchived: true,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Hard delete
        await db.expenseCategories.delete(id);
      }
    });
  },

  async searchCategories(query: string): Promise<ExpenseCategory[]> {
    const lowerQuery = query.toLowerCase();
    return await db.expenseCategories
      .filter((c) => !c.isArchived && c.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }
};
