import { Product, StoreAccount, Transaction } from '../types/store';
import {
  SAMPLE_STORES,
  SAMPLE_PRODUCTS_BY_STORE,
  getSampleTransactionsByStore,
} from '../../server/seedData';

const DB_NAME = 'toko_app_device_db_v1';
const DB_VERSION = 1;

interface StoredProduct extends Product {
  storeId: string;
}

interface StoredTransaction extends Transaction {
  storeId: string;
}

function openDeviceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('app_settings')) {
        db.createObjectStore('app_settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('stores')) {
        db.createObjectStore('stores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'id' });
        prodStore.createIndex('by_store', 'storeId', { unique: false });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by_store', 'storeId', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function seedDeviceDbIfEmpty(db: IDBDatabase): Promise<void> {
  const existingStores = await new Promise<StoreAccount[]>((resolve, reject) => {
    const tx = db.transaction('stores', 'readonly');
    const req = tx.objectStore('stores').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (existingStores.length > 0) return;

  const sampleTxsByStore = getSampleTransactionsByStore();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      ['app_settings', 'stores', 'products', 'transactions'],
      'readwrite'
    );

    tx.objectStore('app_settings').put({ key: 'active_store_id', value: 'store-1' });

    const storesOs = tx.objectStore('stores');
    for (const s of SAMPLE_STORES) {
      storesOs.put(s);
    }

    const productsOs = tx.objectStore('products');
    for (const [storeId, products] of Object.entries(SAMPLE_PRODUCTS_BY_STORE)) {
      for (const p of products) {
        const record: StoredProduct = { ...p, storeId };
        productsOs.put(record);
      }
    }

    const txsOs = tx.objectStore('transactions');
    for (const [storeId, txs] of Object.entries(sampleTxsByStore)) {
      for (const t of txs) {
        const record: StoredTransaction = { ...t, status: t.status || 'completed', storeId };
        txsOs.put(record);
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const deviceDb = {
  async bootstrap(): Promise<{
    stores: StoreAccount[];
    activeStoreId: string;
    productsMap: { [storeId: string]: Product[] };
    transactionsMap: { [storeId: string]: Transaction[] };
  }> {
    const db = await openDeviceDb();
    await seedDeviceDbIfEmpty(db);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        ['app_settings', 'stores', 'products', 'transactions'],
        'readonly'
      );

      const activeReq = tx.objectStore('app_settings').get('active_store_id');
      const storesReq = tx.objectStore('stores').getAll();
      const productsReq = tx.objectStore('products').getAll();
      const txsReq = tx.objectStore('transactions').getAll();

      tx.oncomplete = () => {
        const stores: StoreAccount[] = (storesReq.result || []).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
        );
        const activeStoreId: string =
          activeReq.result?.value || stores[0]?.id || 'store-1';

        const productsMap: { [storeId: string]: Product[] } = {};
        const transactionsMap: { [storeId: string]: Transaction[] } = {};

        for (const s of stores) {
          productsMap[s.id] = [];
          transactionsMap[s.id] = [];
        }

        const allProducts: StoredProduct[] = productsReq.result || [];
        for (const p of allProducts) {
          const { storeId, ...prod } = p;
          if (!productsMap[storeId]) productsMap[storeId] = [];
          productsMap[storeId].push(prod);
        }

        const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const allTxs: StoredTransaction[] = txsReq.result || [];
        for (const t of allTxs) {
          if (new Date(t.timestamp).getTime() >= sevenDaysAgoMs) {
            const { storeId, ...txData } = t;
            if (!transactionsMap[storeId]) transactionsMap[storeId] = [];
            transactionsMap[storeId].push({
              ...txData,
              status: txData.status === 'cancelled' ? 'cancelled' : 'completed',
            });
          }
        }

        for (const k of Object.keys(transactionsMap)) {
          transactionsMap[k].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }

        resolve({ stores, activeStoreId, productsMap, transactionsMap });
      };

      tx.onerror = () => reject(tx.error);
    });
  },

  async setActiveStore(storeId: string): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('app_settings', 'readwrite');
      tx.objectStore('app_settings').put({ key: 'active_store_id', value: storeId });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async createStore(store: StoreAccount): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['stores', 'app_settings'], 'readwrite');
      tx.objectStore('stores').put(store);
      tx.objectStore('app_settings').put({ key: 'active_store_id', value: store.id });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async updateStore(storeId: string, data: Partial<StoreAccount>): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('stores', 'readwrite');
      const os = tx.objectStore('stores');
      const getReq = os.get(storeId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          os.put({ ...getReq.result, ...data });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async deleteStore(storeId: string): Promise<string> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        ['stores', 'products', 'transactions', 'app_settings'],
        'readwrite'
      );
      const storesOs = tx.objectStore('stores');
      storesOs.delete(storeId);

      const prodOs = tx.objectStore('products');
      const prodAll = prodOs.getAll();
      prodAll.onsuccess = () => {
        for (const p of (prodAll.result || []) as StoredProduct[]) {
          if (p.storeId === storeId) prodOs.delete(p.id);
        }
      };

      const txOs = tx.objectStore('transactions');
      const txAll = txOs.getAll();
      txAll.onsuccess = () => {
        for (const t of (txAll.result || []) as StoredTransaction[]) {
          if (t.storeId === storeId) txOs.delete(t.id);
        }
      };

      let nextActiveId = 'store-1';
      const remainingReq = storesOs.getAll();
      remainingReq.onsuccess = () => {
        const rem = (remainingReq.result || []) as StoreAccount[];
        if (rem.length > 0) {
          nextActiveId = rem[0].id;
          tx.objectStore('app_settings').put({
            key: 'active_store_id',
            value: nextActiveId,
          });
        }
      };

      tx.oncomplete = () => resolve(nextActiveId);
      tx.onerror = () => reject(tx.error);
    });
  },

  async upsertProduct(storeId: string, product: Product): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const record: StoredProduct = { ...product, storeId };
      tx.objectStore('products').put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async adjustStock(
    storeId: string,
    productId: string,
    stock: number,
    updatedAt: string
  ): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const os = tx.objectStore('products');
      const req = os.get(productId);
      req.onsuccess = () => {
        if (req.result && req.result.storeId === storeId) {
          os.put({ ...req.result, stock: Math.max(0, stock), updatedAt });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async deleteProducts(_storeId: string, productIds: string[]): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('products', 'readwrite');
      const os = tx.objectStore('products');
      for (const id of productIds) {
        os.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async recordTransaction(
    storeId: string,
    transaction: Transaction
  ): Promise<{ products: Product[]; transactions: Transaction[] }> {
    const db = await openDeviceDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['transactions', 'products'], 'readwrite');
      const txOs = tx.objectStore('transactions');
      const prodOs = tx.objectStore('products');

      const record: StoredTransaction = {
        ...transaction,
        status: transaction.status || 'completed',
        storeId,
      };
      txOs.put(record);

      const nowIso = new Date().toISOString();
      for (const item of transaction.items) {
        const getReq = prodOs.get(item.productId);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const updatedStock = Math.max(0, getReq.result.stock - item.quantity);
            prodOs.put({ ...getReq.result, stock: updatedStock, updatedAt: nowIso });
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const full = await this.bootstrap();
    return {
      products: full.productsMap[storeId] || [],
      transactions: full.transactionsMap[storeId] || [],
    };
  },

  async cancelTransaction(
    storeId: string,
    transactionId: string
  ): Promise<{ products: Product[]; transactions: Transaction[] }> {
    const db = await openDeviceDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['transactions', 'products'], 'readwrite');
      const txOs = tx.objectStore('transactions');
      const prodOs = tx.objectStore('products');

      const getTxReq = txOs.get(transactionId);
      getTxReq.onsuccess = () => {
        const existingTx = getTxReq.result as StoredTransaction | undefined;
        if (!existingTx || existingTx.storeId !== storeId || existingTx.status === 'cancelled') {
          return;
        }

        txOs.put({ ...existingTx, status: 'cancelled' });

        const nowIso = new Date().toISOString();
        for (const item of existingTx.items) {
          const getProdReq = prodOs.get(item.productId);
          getProdReq.onsuccess = () => {
            if (getProdReq.result && getProdReq.result.storeId === storeId) {
              const restoredStock = Number(getProdReq.result.stock) + Number(item.quantity);
              prodOs.put({
                ...getProdReq.result,
                stock: restoredStock,
                updatedAt: nowIso,
              });
            }
          };
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    const full = await this.bootstrap();
    return {
      products: full.productsMap[storeId] || [],
      transactions: full.transactionsMap[storeId] || [],
    };
  },

  async clearTransactions(storeId: string): Promise<void> {
    const db = await openDeviceDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readwrite');
      const os = tx.objectStore('transactions');
      const allReq = os.getAll();
      allReq.onsuccess = () => {
        for (const t of (allReq.result || []) as StoredTransaction[]) {
          if (t.storeId === storeId) os.delete(t.id);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
