import { Product, StoreAccount, Transaction } from '../types/store';
import { deviceDb } from './deviceDb';

let useDeviceLocalDb = false;

async function detectBackendMode(): Promise<boolean> {
  // If running inside Capacitor Android APK (capacitor:// or https://localhost without Node API)
  const isCapacitorNative =
    typeof window !== 'undefined' &&
    Boolean((window as any).Capacitor?.isNativePlatform?.());

  if (isCapacitorNative) {
    useDeviceLocalDb = true;
    return true;
  }

  try {
    const res = await fetch('/api/bootstrap', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      useDeviceLocalDb = false;
      return false;
    }
  } catch {
    // Offline or standalone APK
  }

  useDeviceLocalDb = true;
  return true;
}

export const dataService = {
  async bootstrap(): Promise<{
    stores: StoreAccount[];
    activeStoreId: string;
    productsMap: { [storeId: string]: Product[] };
    transactionsMap: { [storeId: string]: Transaction[] };
  }> {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore
    }

    const isOfflineDevice = await detectBackendMode();
    if (isOfflineDevice) {
      return deviceDb.bootstrap();
    }

    const res = await fetch('/api/bootstrap', { cache: 'no-store' });
    if (!res.ok) throw new Error('Gagal memuat data dari database');
    return res.json();
  },

  async setActiveStore(storeId: string): Promise<void> {
    if (useDeviceLocalDb) {
      await deviceDb.setActiveStore(storeId);
      return;
    }
    await fetch('/api/settings/active-store', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId }),
    });
  },

  async createStore(store: StoreAccount): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.createStore(store);
      return true;
    }
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    });
    return res.ok;
  },

  async updateStore(storeId: string, data: Partial<StoreAccount>): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.updateStore(storeId, data);
      return true;
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  },

  async deleteStore(storeId: string): Promise<{ ok: boolean; activeStoreId?: string }> {
    if (useDeviceLocalDb) {
      const activeStoreId = await deviceDb.deleteStore(storeId);
      return { ok: true, activeStoreId };
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, activeStoreId: data.activeStoreId };
  },

  async clearTransactions(storeId: string): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.clearTransactions(storeId);
      return true;
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/transactions`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async recordTransaction(
    storeId: string,
    tx: Transaction
  ): Promise<{ ok: boolean; products?: Product[]; transactions?: Transaction[] }> {
    if (useDeviceLocalDb) {
      const data = await deviceDb.recordTransaction(storeId, tx);
      return { ok: true, ...data };
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, products: data.products, transactions: data.transactions };
  },

  async cancelTransaction(
    storeId: string,
    transactionId: string
  ): Promise<{ ok: boolean; products?: Product[]; transactions?: Transaction[] }> {
    if (useDeviceLocalDb) {
      const data = await deviceDb.cancelTransaction(storeId, transactionId);
      return { ok: true, ...data };
    }
    const res = await fetch(
      `/api/stores/${encodeURIComponent(storeId)}/transactions/${encodeURIComponent(transactionId)}/cancel`,
      {
        method: 'PATCH',
      }
    );
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, products: data.products, transactions: data.transactions };
  },

  async adjustStock(
    storeId: string,
    productId: string,
    stock: number,
    updatedAt: string
  ): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.adjustStock(storeId, productId, stock, updatedAt);
      return true;
    }
    const res = await fetch(
      `/api/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}/stock`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock, updatedAt }),
      }
    );
    return res.ok;
  },

  async upsertProduct(storeId: string, product: Product): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.upsertProduct(storeId, product);
      return true;
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return res.ok;
  },

  async deleteProducts(storeId: string, productIds: string[]): Promise<boolean> {
    if (useDeviceLocalDb) {
      await deviceDb.deleteProducts(storeId, productIds);
      return true;
    }
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}/products`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds }),
    });
    return res.ok;
  },
};
