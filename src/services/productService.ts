import { db } from '../db/db';
import type { Product } from '../types';

export const productService = {
  async getProducts(): Promise<Product[]> {
    return await db.products.orderBy('createdAt').reverse().toArray();
  },

  async getProductById(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    if (product.barcode) {
      const existing = await db.products.where('barcode').equals(product.barcode).first();
      if (existing) {
        throw new Error(`Mahsulot shtrix-kodi band: ${product.barcode}`);
      }
    }

    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.products.add(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
    const existingProduct = await db.products.get(id);
    if (!existingProduct) {
      throw new Error("Mahsulot topilmadi");
    }

    if (updates.barcode && updates.barcode !== existingProduct.barcode) {
      const barcodeExists = await db.products.where('barcode').equals(updates.barcode).first();
      if (barcodeExists) {
        throw new Error(`Mahsulot shtrix-kodi band: ${updates.barcode}`);
      }
    }

    const updatedProduct = {
      ...existingProduct,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.products.put(updatedProduct);
    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    await db.products.delete(id);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    
    return await db.products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(lowerQuery) ||
          (!!product.barcode && product.barcode.toLowerCase().includes(lowerQuery)) ||
          (!!product.category && product.category.toLowerCase().includes(lowerQuery))
        );
      })
      .toArray();
  },

  async getLowStockProducts(): Promise<Product[]> {
    return await db.products
      .filter((product) => product.quantity <= product.minQuantity)
      .toArray();
  }
};
