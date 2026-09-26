import { db } from '../db/db';
import type { Sale } from '../types';

export const saleService = {
  async getSales(): Promise<Sale[]> {
    return await db.sales.orderBy('createdAt').reverse().toArray();
  },

  async getSaleById(id: string): Promise<Sale | undefined> {
    return await db.sales.get(id);
  },

  async createSale(saleData: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    return await db.transaction('rw', db.products, db.sales, db.debts, async () => {
      // 1. Stock validation & updating
      for (const item of saleData.items) {
        const product = await db.products.get(item.productId);
        if (!product) {
          throw new Error(`Mahsulot topilmadi: ${item.productName}`);
        }
        
        if (product.quantity < item.quantity) {
          throw new Error(`Mahsulot omborda yetarli emas: ${product.name} (Mavjud: ${product.quantity})`);
        }

        // Update stock
        await db.products.update(product.id, {
          quantity: product.quantity - item.quantity,
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Create Sale
      const newSale: Sale = {
        ...saleData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      await db.sales.add(newSale);

      // 3. Create Debt if needed
      if (newSale.paymentType === 'debt' && newSale.debtAmount > 0) {
        if (!newSale.customerId) {
          throw new Error("Qarzga sotuv uchun mijoz tanlash majburiy.");
        }
        
        await db.debts.add({
          id: crypto.randomUUID(),
          saleId: newSale.id,
          customerId: newSale.customerId,
          originalAmount: newSale.debtAmount,
          paidAmount: 0,
          remainingAmount: newSale.debtAmount,
          status: 'unpaid',
          createdAt: newSale.createdAt,
          updatedAt: newSale.createdAt
        });
      }

      return newSale;
    });
  },

  async deleteSale(id: string): Promise<void> {
    return await db.transaction('rw', db.products, db.sales, db.debts, db.debtPayments, async () => {
      const sale = await db.sales.get(id);
      if (!sale) {
        throw new Error("Sotuv topilmadi");
      }

      // Revert stock
      for (const item of sale.items) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(product.id, {
            quantity: product.quantity + item.quantity,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Delete related debt and payments
      const debt = await db.debts.where('saleId').equals(id).first();
      if (debt) {
        await db.debtPayments.where('debtId').equals(debt.id).delete();
        await db.debts.delete(debt.id);
      }

      // Delete sale
      await db.sales.delete(id);
    });
  },

  async getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    // Both startDate and endDate should be ISO strings or at least lexicographically comparable
    return await db.sales
      .where('createdAt')
      .between(startDate, endDate)
      .reverse()
      .toArray();
  }
};
