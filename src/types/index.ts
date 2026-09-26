export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category?: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentType: 'cash' | 'card' | 'debt';
  paidAmount: number;
  debtAmount: number;
  createdAt: string;
}

export interface Debt {
  id: string;
  saleId: string;
  customerId: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  customerId: string;
  amount: number;
  paymentType: 'cash' | 'card';
  note?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  note?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  key: string;
  value: any;
  updatedAt: string;
}
