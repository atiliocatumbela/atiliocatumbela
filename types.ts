
export type SaleType = 'RETAIL' | 'WHOLESALE';

export interface Product {
  id: string;
  name: string;
  price: number; 
  stock: number;
  category: string;
  type: SaleType; // Define se este registro é de Retalho ou Grosso
}

export type TransactionType = 'ENTRY' | 'SALE' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  productId?: string;
  productName?: string;
  type: TransactionType;
  saleType: SaleType;
  quantity: number;
  value: number;
  description: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netBalance: number;
  lowStockItems: number;
}
