import { db } from '../db/db';
import { expenseCategoryService } from './expenseCategoryService';
import { customerService } from './customerService';


export interface ReportSummary {
  totalSales: number;
  totalExpenses: number;
  openDebt: number;
  salesCount: number;
  expensesCount: number;
}

export interface SalesReport {
  totalSales: number;
  salesCount: number;
  averageSale: number;
  byPaymentType: {
    cash: number;
    card: number;
    debt: number; // total amount of sales made as 'debt'
    paidAmountFromDebt: number; // the paid part of debt sales
    actualDebtAmount: number; // the unpaid part of debt sales
  }
}

export interface ExpensesReport {
  totalExpenses: number;
  expensesCount: number;
  averageExpense: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  quantitySold: number;
  totalSum: number;
}

export interface CustomerSalesReport {
  customerId?: string;
  customerName: string;
  salesCount: number;
  totalSum: number;
}

export interface DebtReport {
  totalOpenDebt: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
}

export interface DebtPaymentReport {
  totalPaid: number;
  cashPaid: number;
  cardPaid: number;
  paymentsCount: number;
}

export const reportService = {
  // Helper to filter dates (inclusive of start and end days)
  isBetween(dateIso: string, start: string, end: string) {
    const d = new Date(dateIso).getTime();
    const s = new Date(start).getTime();
    
    const eDate = new Date(end);
    eDate.setHours(23, 59, 59, 999);
    const e = eDate.getTime();
    
    return d >= s && d <= e;
  },

  async getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
    const allSales = await db.sales.toArray();
    const sales = allSales.filter(s => this.isBetween(s.createdAt, startDate, endDate));

    let totalSales = 0;
    const byPaymentType = { cash: 0, card: 0, debt: 0, paidAmountFromDebt: 0, actualDebtAmount: 0 };

    sales.forEach(s => {
      totalSales += s.total;
      if (s.paymentType === 'cash') byPaymentType.cash += s.total;
      else if (s.paymentType === 'card') byPaymentType.card += s.total;
      else if (s.paymentType === 'debt') {
        byPaymentType.debt += s.total;
        byPaymentType.paidAmountFromDebt += s.paidAmount;
        byPaymentType.actualDebtAmount += s.debtAmount;
      }
    });

    return {
      totalSales,
      salesCount: sales.length,
      averageSale: sales.length > 0 ? totalSales / sales.length : 0,
      byPaymentType
    };
  },

  async getExpensesReport(startDate: string, endDate: string): Promise<ExpensesReport> {
    const allExpenses = await db.expenses.toArray();
    const expenses = allExpenses.filter(e => this.isBetween(e.date, startDate, endDate));

    let totalExpenses = 0;
    const catMap: Record<string, { total: number; count: number }> = {};

    expenses.forEach(e => {
      totalExpenses += e.amount;
      if (!catMap[e.categoryId]) catMap[e.categoryId] = { total: 0, count: 0 };
      catMap[e.categoryId].total += e.amount;
      catMap[e.categoryId].count += 1;
    });

    const categories = await expenseCategoryService.getCategories();
    
    const byCategory = Object.keys(catMap).map(catId => {
      const cat = categories.find(c => c.id === catId);
      const totalAmount = catMap[catId].total;
      return {
        categoryId: catId,
        categoryName: cat ? cat.name : "Noma'lum",
        totalAmount,
        count: catMap[catId].count,
        percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      totalExpenses,
      expensesCount: expenses.length,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      byCategory
    };
  },

  async getDebtReport(startDate: string, endDate: string): Promise<DebtReport> {
    const allDebts = await db.debts.toArray();
    const debts = allDebts.filter(d => this.isBetween(d.createdAt, startDate, endDate));

    let totalOpenDebt = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    debts.forEach(d => {
      if (d.remainingAmount > 0) totalOpenDebt += d.remainingAmount;
      
      if (d.status === 'unpaid') unpaidCount++;
      else if (d.status === 'partial') partialCount++;
      else if (d.status === 'paid') paidCount++;
    });

    return { totalOpenDebt, unpaidCount, partialCount, paidCount };
  },

  async getDebtPaymentReport(startDate: string, endDate: string): Promise<DebtPaymentReport> {
    const allPayments = await db.debtPayments.toArray();
    const payments = allPayments.filter(p => this.isBetween(p.createdAt, startDate, endDate));

    let totalPaid = 0;
    let cashPaid = 0;
    let cardPaid = 0;

    payments.forEach(p => {
      totalPaid += p.amount;
      if (p.paymentType === 'cash') cashPaid += p.amount;
      else if (p.paymentType === 'card') cardPaid += p.amount;
    });

    return {
      totalPaid,
      cashPaid,
      cardPaid,
      paymentsCount: payments.length
    };
  },

  async getProductSalesReport(startDate: string, endDate: string): Promise<ProductSalesReport[]> {
    const allSales = await db.sales.toArray();
    const sales = allSales.filter(s => this.isBetween(s.createdAt, startDate, endDate));

    const pMap: Record<string, { name: string; qty: number; sum: number }> = {};

    sales.forEach(s => {
      s.items.forEach(item => {
        if (!pMap[item.productId]) {
          pMap[item.productId] = { name: item.productName, qty: 0, sum: 0 };
        }
        pMap[item.productId].qty += item.quantity;
        pMap[item.productId].sum += item.total;
      });
    });

    return Object.keys(pMap).map(id => ({
      productId: id,
      productName: pMap[id].name,
      quantitySold: pMap[id].qty,
      totalSum: pMap[id].sum
    })).sort((a, b) => b.quantitySold - a.quantitySold);
  },

  async getCustomerSalesReport(startDate: string, endDate: string): Promise<CustomerSalesReport[]> {
    const allSales = await db.sales.toArray();
    const sales = allSales.filter(s => this.isBetween(s.createdAt, startDate, endDate));

    const cMap: Record<string, { count: number; sum: number }> = {};
    let unknownCount = 0;
    let unknownSum = 0;

    sales.forEach(s => {
      if (s.customerId) {
        if (!cMap[s.customerId]) cMap[s.customerId] = { count: 0, sum: 0 };
        cMap[s.customerId].count++;
        cMap[s.customerId].sum += s.total;
      } else {
        unknownCount++;
        unknownSum += s.total;
      }
    });

    const result: CustomerSalesReport[] = [];
    
    // Fetch customers to get their names
    for (const cId of Object.keys(cMap)) {
      const customer = await customerService.getCustomerById(cId);
      result.push({
        customerId: cId,
        customerName: customer ? customer.name : "Noma'lum",
        salesCount: cMap[cId].count,
        totalSum: cMap[cId].sum
      });
    }

    if (unknownCount > 0) {
      result.push({
        customerName: "Mijoz ko'rsatilmagan",
        salesCount: unknownCount,
        totalSum: unknownSum
      });
    }

    return result.sort((a, b) => b.totalSum - a.totalSum);
  },

  async getReportSummary(startDate: string, endDate: string): Promise<ReportSummary> {
    const sales = await this.getSalesReport(startDate, endDate);
    const expenses = await this.getExpensesReport(startDate, endDate);
    const debts = await this.getDebtReport(startDate, endDate);

    return {
      totalSales: sales.totalSales,
      totalExpenses: expenses.totalExpenses,
      openDebt: debts.totalOpenDebt,
      salesCount: sales.salesCount,
      expensesCount: expenses.expensesCount
    };
  }
};
