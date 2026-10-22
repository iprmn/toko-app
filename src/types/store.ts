export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sellPrice: number; // Harga jual ke pembeli
  buyPrice: number;  // Modal / harga beli
  stock: number;
  minStock: number;  // Batas stok menipis (biasanya 3-5)
  unit: string;      // pcs, bks, kg, unit, pasang, dll
  barcode?: string;
  imageUrl?: string; // Optional user uploaded photo (data URL or image URL)
  shelf?: string;    // Nama rak atau etalase penyimpanan (manual)
  iconType: string;  // key for preset icon or emoji
  bgColor: string;   // soft background color for card visual
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  sellPrice: number;
  buyPrice: number;
  quantity: number;
  unit: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  items: TransactionItem[];
  totalAmount: number;
  totalProfit: number;
  cashPaid: number;
  change: number;
  notes?: string;
}

export interface StoreAccount {
  id: string;
  name: string;
  ownerName: string;
  categoryOrType: string;
  tagline?: string;
  logoUrl?: string; // Optional custom store logo image
  createdAt: string;
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  tagline: string;
  soundEnabled: boolean;
}
