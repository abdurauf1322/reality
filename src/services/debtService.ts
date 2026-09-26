import { db } from '../db/db';
import type { Debt, DebtPayment } from '../types';

export const debtService = {
  async getDebts(): Promise<Debt[]> {
    return await db.debts.orderBy('createdAt').reverse().toArray();
  },

  async getDebtById(id: string): Promise<Debt | undefined> {
    return await db.debts.get(id);
  },

  async getDebtsByCustomer(customerId: string): Promise<Debt[]> {
    return await db.debts.where('customerId').equals(customerId).reverse().sortBy('createdAt');
  },

  async getDebtBySale(saleId: string): Promise<Debt | undefined> {
    return await db.debts.where('saleId').equals(saleId).first();
  },

  async getOpenDebts(): Promise<Debt[]> {
    return await db.debts.filter(d => d.remainingAmount > 0).reverse().sortBy('createdAt');
  },

  async getCustomerTotalDebt(customerId: string): Promise<number> {
    const debts = await this.getDebtsByCustomer(customerId);
    return debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  },

  // Usually called by saleService, but good to have here
  async createDebt(debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const now = new Date().toISOString();
    const newDebt: Debt = {
      ...debtData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.debts.add(newDebt);
    return newDebt;
  },

  async addDebtPayment(debtId: string, paymentData: Omit<DebtPayment, 'id' | 'debtId' | 'customerId' | 'createdAt'>): Promise<DebtPayment> {
    return await db.transaction('rw', db.debts, db.debtPayments, async () => {
      const debt = await db.debts.get(debtId);
      if (!debt) {
        throw new Error("Qarz topilmadi");
      }

      if (paymentData.amount <= 0) {
        throw new Error("To'lov summasi noldan katta bo'lishi kerak.");
      }

      if (paymentData.amount > debt.remainingAmount) {
        throw new Error("To'lov summasi qolgan qarzdan katta bo'lishi mumkin emas.");
      }

      const now = new Date().toISOString();
      
      const newPayment: DebtPayment = {
        id: crypto.randomUUID(),
        debtId: debt.id,
        customerId: debt.customerId,
        amount: paymentData.amount,
        paymentType: paymentData.paymentType,
        note: paymentData.note,
        createdAt: now
      };

      const newPaidAmount = debt.paidAmount + paymentData.amount;
      const newRemaining = debt.originalAmount - newPaidAmount;
      const newStatus = newRemaining === 0 ? 'paid' : 'partial';

      await db.debts.update(debt.id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        status: newStatus,
        updatedAt: now
      });

      await db.debtPayments.add(newPayment);

      return newPayment;
    });
  },

  async getDebtPayments(debtId: string): Promise<DebtPayment[]> {
    return await db.debtPayments.where('debtId').equals(debtId).reverse().sortBy('createdAt');
  },

  async deleteDebtPayment(paymentId: string): Promise<void> {
    return await db.transaction('rw', db.debts, db.debtPayments, async () => {
      const payment = await db.debtPayments.get(paymentId);
      if (!payment) {
        throw new Error("To'lov topilmadi");
      }

      const debt = await db.debts.get(payment.debtId);
      if (!debt) {
        throw new Error("Asosiy qarz topilmadi");
      }

      const newPaidAmount = debt.paidAmount - payment.amount;
      const newRemaining = debt.originalAmount - newPaidAmount;
      const newStatus = newPaidAmount === 0 ? 'unpaid' : (newRemaining === 0 ? 'paid' : 'partial');

      await db.debts.update(debt.id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await db.debtPayments.delete(paymentId);
    });
  },

  async getDebtStats() {
    const allDebts = await db.debts.toArray();
    let totalDebtAmount = 0;
    let totalUnpaidCount = 0;
    let totalPartialCount = 0;
    let totalPaidCount = 0;

    for (const d of allDebts) {
      if (d.remainingAmount > 0) {
        totalDebtAmount += d.remainingAmount;
      }
      if (d.status === 'unpaid') totalUnpaidCount++;
      else if (d.status === 'partial') totalPartialCount++;
      else if (d.status === 'paid') totalPaidCount++;
    }

    return { totalDebtAmount, totalUnpaidCount, totalPartialCount, totalPaidCount };
  }
};
