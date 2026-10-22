import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_STORES, SAMPLE_PRODUCTS_BY_STORE, getSampleTransactionsByStore } from './seedData';
import { Product, StoreAccount, Transaction, TransactionItem } from '../src/types/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const DB_PATH = path.join(DB_DIR, 'toko.db');

const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for performance & integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Create relational tables
db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    category_or_type TEXT NOT NULL,
    tagline TEXT,
    logo_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sell_price INTEGER NOT NULL,
    buy_price INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    unit TEXT NOT NULL,
    barcode TEXT,
    image_url TEXT,
    shelf TEXT,
    icon_type TEXT NOT NULL,
    bg_color TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    total_profit INTEGER NOT NULL,
    cash_paid INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    sell_price INTEGER NOT NULL,
    buy_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
  );
`);

export function seedDatabaseIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM stores').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return;
  }

  console.log('[DB] Seeding initial sample data into SQLite database...');
  db.exec('BEGIN TRANSACTION;');
  try {
    const insertSetting = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    insertSetting.run('active_store_id', 'store-1');

    const insertStore = db.prepare(`
      INSERT INTO stores (id, name, owner_name, category_or_type, tagline, logo_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of SAMPLE_STORES) {
      insertStore.run(
        s.id,
        s.name,
        s.ownerName,
        s.categoryOrType,
        s.tagline ?? null,
        s.logoUrl ?? null,
        s.createdAt
      );
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, store_id, name, category, sell_price, buy_price, stock, min_stock,
        unit, barcode, image_url, shelf, icon_type, bg_color, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [storeId, products] of Object.entries(SAMPLE_PRODUCTS_BY_STORE)) {
      for (const p of products) {
        insertProduct.run(
          p.id,
          storeId,
          p.name,
          p.category,
          p.sellPrice,
          p.buyPrice,
          p.stock,
          p.minStock,
          p.unit,
          p.barcode ?? null,
          p.imageUrl ?? null,
          p.shelf ?? null,
          p.iconType,
          p.bgColor,
          p.updatedAt
        );
      }
    }

    const insertTx = db.prepare(`
      INSERT INTO transactions (
        id, store_id, timestamp, total_amount, total_profit, cash_paid, change_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTxItem = db.prepare(`
      INSERT INTO transaction_items (
        transaction_id, product_id, product_name, sell_price, buy_price, quantity, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleTxsByStore = getSampleTransactionsByStore();
    for (const [storeId, txs] of Object.entries(sampleTxsByStore)) {
      for (const tx of txs) {
        insertTx.run(
          tx.id,
          storeId,
          tx.timestamp,
          tx.totalAmount,
          tx.totalProfit,
          tx.cashPaid,
          tx.change,
          tx.notes ?? null
        );
        for (const item of tx.items) {
          insertTxItem.run(
            tx.id,
            item.productId,
            item.productName,
            item.sellPrice,
            item.buyPrice,
            item.quantity,
            item.unit
          );
        }
      }
    }

    db.exec('COMMIT;');
    console.log('[DB] Sample data seeded successfully.');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[DB] Error seeding database:', err);
    throw err;
  }
}

// Automatically seed on startup if empty
seedDatabaseIfEmpty();

// --- Data Access Helpers ---

export function getActiveStoreId(): string {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('active_store_id') as { value: string } | undefined;
  if (row?.value) return row.value;
  const firstStore = db.prepare('SELECT id FROM stores ORDER BY created_at ASC LIMIT 1').get() as { id: string } | undefined;
  return firstStore?.id || 'store-1';
}

export function setActiveStoreIdInDb(storeId: string): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('active_store_id', storeId);
}

export function getAllStores(): StoreAccount[] {
  const rows = db.prepare('SELECT * FROM stores ORDER BY created_at ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    ownerName: r.owner_name,
    categoryOrType: r.category_or_type,
    tagline: r.tagline || undefined,
    logoUrl: r.logo_url || undefined,
    createdAt: r.created_at,
  }));
}

export function getProductsByStore(storeId: string): Product[] {
  const rows = db.prepare('SELECT * FROM products WHERE store_id = ? ORDER BY rowid DESC').all(storeId) as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    sellPrice: Number(r.sell_price),
    buyPrice: Number(r.buy_price),
    stock: Number(r.stock),
    minStock: Number(r.min_stock),
    unit: r.unit,
    barcode: r.barcode || undefined,
    imageUrl: r.image_url || undefined,
    shelf: r.shelf || undefined,
    iconType: r.icon_type,
    bgColor: r.bg_color,
    updatedAt: r.updated_at,
  }));
}

export function getTransactionsByStore(storeId: string): Transaction[] {
  // Prune transactions older than 7 days in DB as well
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM transactions WHERE store_id = ? AND timestamp < ?').run(storeId, sevenDaysAgoIso);

  const txRows = db.prepare('SELECT * FROM transactions WHERE store_id = ? ORDER BY timestamp DESC').all(storeId) as any[];
  const getItemsStmt = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ? ORDER BY id ASC');

  return txRows.map((tx) => {
    const itemRows = getItemsStmt.all(tx.id) as any[];
    const items: TransactionItem[] = itemRows.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      sellPrice: Number(it.sell_price),
      buyPrice: Number(it.buy_price),
      quantity: Number(it.quantity),
      unit: it.unit,
    }));

    return {
      id: tx.id,
      timestamp: tx.timestamp,
      items,
      totalAmount: Number(tx.total_amount),
      totalProfit: Number(tx.total_profit),
      cashPaid: Number(tx.cash_paid),
      change: Number(tx.change_amount),
      notes: tx.notes || undefined,
    };
  });
}

export function createStore(store: StoreAccount): StoreAccount {
  db.prepare(`
    INSERT INTO stores (id, name, owner_name, category_or_type, tagline, logo_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    store.id,
    store.name,
    store.ownerName,
    store.categoryOrType,
    store.tagline ?? null,
    store.logoUrl ?? null,
    store.createdAt
  );
  setActiveStoreIdInDb(store.id);
  return store;
}

export function updateStore(storeId: string, data: Partial<StoreAccount>): void {
  const existing = db.prepare('SELECT * FROM stores WHERE id = ?').get(storeId) as any;
  if (!existing) return;

  const name = data.name !== undefined ? data.name : existing.name;
  const ownerName = data.ownerName !== undefined ? data.ownerName : existing.owner_name;
  const categoryOrType = data.categoryOrType !== undefined ? data.categoryOrType : existing.category_or_type;
  const tagline = 'tagline' in data ? (data.tagline ?? null) : existing.tagline;
  const logoUrl = 'logoUrl' in data ? (data.logoUrl ?? null) : existing.logo_url;

  db.prepare(`
    UPDATE stores
    SET name = ?, owner_name = ?, category_or_type = ?, tagline = ?, logo_url = ?
    WHERE id = ?
  `).run(name, ownerName, categoryOrType, tagline, logoUrl, storeId);
}

export function deleteStore(storeId: string): string {
  db.prepare('DELETE FROM stores WHERE id = ?').run(storeId);
  const remaining = getAllStores();
  const nextActiveId = remaining[0]?.id || 'store-1';
  if (getActiveStoreId() === storeId) {
    setActiveStoreIdInDb(nextActiveId);
  }
  return getActiveStoreId();
}

export function upsertProduct(storeId: string, product: Product): Product {
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(product.id);
  if (existing) {
    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, sell_price = ?, buy_price = ?, stock = ?, min_stock = ?,
          unit = ?, barcode = ?, image_url = ?, shelf = ?, icon_type = ?, bg_color = ?, updated_at = ?
      WHERE id = ? AND store_id = ?
    `).run(
      product.name,
      product.category,
      product.sellPrice,
      product.buyPrice,
      product.stock,
      product.minStock,
      product.unit,
      product.barcode ?? null,
      product.imageUrl ?? null,
      product.shelf ?? null,
      product.iconType,
      product.bgColor,
      product.updatedAt,
      product.id,
      storeId
    );
  } else {
    db.prepare(`
      INSERT INTO products (
        id, store_id, name, category, sell_price, buy_price, stock, min_stock,
        unit, barcode, image_url, shelf, icon_type, bg_color, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.id,
      storeId,
      product.name,
      product.category,
      product.sellPrice,
      product.buyPrice,
      product.stock,
      product.minStock,
      product.unit,
      product.barcode ?? null,
      product.imageUrl ?? null,
      product.shelf ?? null,
      product.iconType,
      product.bgColor,
      product.updatedAt
    );
  }
  return product;
}

export function adjustProductStock(storeId: string, productId: string, newStock: number, updatedAt: string): void {
  db.prepare(`
    UPDATE products SET stock = ?, updated_at = ? WHERE id = ? AND store_id = ?
  `).run(Math.max(0, newStock), updatedAt, productId, storeId);
}

export function deleteProducts(storeId: string, productIds: string[]): void {
  const stmt = db.prepare('DELETE FROM products WHERE id = ? AND store_id = ?');
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const id of productIds) {
      stmt.run(id, storeId);
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function recordTransactionAndReduceStock(storeId: string, tx: Transaction): void {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO transactions (
        id, store_id, timestamp, total_amount, total_profit, cash_paid, change_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.id,
      storeId,
      tx.timestamp,
      tx.totalAmount,
      tx.totalProfit,
      tx.cashPaid,
      tx.change,
      tx.notes ?? null
    );

    const insertItem = db.prepare(`
      INSERT INTO transaction_items (
        transaction_id, product_id, product_name, sell_price, buy_price, quantity, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const reduceStock = db.prepare(`
      UPDATE products
      SET stock = MAX(0, stock - ?), updated_at = ?
      WHERE id = ? AND store_id = ?
    `);

    const nowIso = new Date().toISOString();
    for (const item of tx.items) {
      insertItem.run(
        tx.id,
        item.productId,
        item.productName,
        item.sellPrice,
        item.buyPrice,
        item.quantity,
        item.unit
      );
      reduceStock.run(item.quantity, nowIso, item.productId, storeId);
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function clearStoreTransactions(storeId: string): void {
  db.prepare('DELETE FROM transactions WHERE store_id = ?').run(storeId);
}

export default db;
