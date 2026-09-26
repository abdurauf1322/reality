import { db } from '../db/db';
import type { Customer, Sale } from '../types';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    return await db.customers
      .filter(c => !c.isArchived)
      .reverse()
      .sortBy('createdAt');
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const customer = await db.customers.get(id);
    if (customer && customer.isArchived) {
      return undefined;
    }
    return customer;
  },

  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.customers.add(newCustomer);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> {
    const existing = await db.customers.get(id);
    if (!existing || existing.isArchived) {
      throw new Error("Mijoz topilmadi");
    }

    const updatedCustomer = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.customers.put(updatedCustomer);
    return updatedCustomer;
  },

  async deleteCustomer(id: string): Promise<void> {
    return await db.transaction('rw', db.customers, db.sales, async () => {
      const existing = await db.customers.get(id);
      if (!existing || existing.isArchived) {
        throw new Error("Mijoz topilmadi");
      }

      // Check if there are related sales
      const salesCount = await db.sales.where('customerId').equals(id).count();
      
      if (salesCount > 0) {
        // Soft delete
        await db.customers.update(id, {
          isArchived: true,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Hard delete
        await db.customers.delete(id);
      }
    });
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const lowerQuery = query.toLowerCase();
    return await db.customers
      .filter((c) => {
        if (c.isArchived) return false;
        return (
          c.name.toLowerCase().includes(lowerQuery) ||
          (!!c.phone && c.phone.toLowerCase().includes(lowerQuery))
        );
      })
      .toArray();
  },

  async getCustomerSales(customerId: string): Promise<Sale[]> {
    return await db.sales
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('createdAt');
  },
  
  // Helper to get all stats for a customer
  async getCustomerStats(customerId: string) {
    const sales = await this.getCustomerSales(customerId);
    const salesCount = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const debts = await db.debts.where('customerId').equals(customerId).toArray();
    const debtAmount = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    return { salesCount, totalAmount, debtAmount };
  }
};
