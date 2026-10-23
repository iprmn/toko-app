import express from 'express';
import {
  getAllStores,
  getActiveStoreId,
  setActiveStoreIdInDb,
  getFontSizeLevel,
  setFontSizeLevelInDb,
  getProductsByStore,
  getTransactionsByStore,
  createStore,
  updateStore,
  deleteStore,
  upsertProduct,
  adjustProductStock,
  deleteProducts,
  recordTransactionAndReduceStock,
  cancelTransactionAndRestoreStock,
  clearStoreTransactions,
} from './db';
import { Product, StoreAccount, Transaction } from '../src/types/store';

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Disable caching on all API responses so browser never caches stale DB state
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Get full initial state from SQLite DB
  app.get('/bootstrap', (_req, res) => {
    try {
      const stores = getAllStores();
      const activeStoreId = getActiveStoreId();
      const fontSizeLevel = getFontSizeLevel();
      const productsMap: { [storeId: string]: Product[] } = {};
      const transactionsMap: { [storeId: string]: Transaction[] } = {};

      for (const s of stores) {
        productsMap[s.id] = getProductsByStore(s.id);
        transactionsMap[s.id] = getTransactionsByStore(s.id);
      }

      res.json({
        stores,
        activeStoreId,
        fontSizeLevel,
        productsMap,
        transactionsMap,
      });
    } catch (err: any) {
      console.error('[API] GET /bootstrap error:', err);
      res.status(500).json({ error: err.message || 'Database error' });
    }
  });

  // Set active store in DB
  app.put('/settings/active-store', (req, res) => {
    try {
      const { storeId } = req.body;
      if (!storeId) {
        res.status(400).json({ error: 'storeId is required' });
        return;
      }
      setActiveStoreIdInDb(storeId);
      res.json({ activeStoreId: storeId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Set font size level in DB (1..4, default 2)
  app.put('/settings/font-size', (req, res) => {
    try {
      const level = Number(req.body?.level) || 2;
      setFontSizeLevelInDb(level);
      res.json({ fontSizeLevel: level });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create store
  app.post('/stores', (req, res) => {
    try {
      const store: StoreAccount = req.body;
      const created = createStore(store);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update store
  app.put('/stores/:storeId', (req, res) => {
    try {
      const { storeId } = req.params;
      updateStore(storeId, req.body);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete store
  app.delete('/stores/:storeId', (req, res) => {
    try {
      const { storeId } = req.params;
      const activeStoreId = deleteStore(storeId);
      res.json({ ok: true, activeStoreId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upsert product (create or edit)
  app.post('/stores/:storeId/products', (req, res) => {
    try {
      const { storeId } = req.params;
      const product: Product = req.body;
      const saved = upsertProduct(storeId, product);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update product stock
  app.patch('/stores/:storeId/products/:productId/stock', (req, res) => {
    try {
      const { storeId, productId } = req.params;
      const { stock, updatedAt } = req.body;
      adjustProductStock(storeId, productId, Number(stock), updatedAt || new Date().toISOString());
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete one or multiple products
  app.delete('/stores/:storeId/products', (req, res) => {
    try {
      const { storeId } = req.params;
      const { productIds } = req.body;
      if (!Array.isArray(productIds)) {
        res.status(400).json({ error: 'productIds array required' });
        return;
      }
      deleteProducts(storeId, productIds);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record sale transaction and decrement product stock atomically
  app.post('/stores/:storeId/transactions', (req, res) => {
    try {
      const { storeId } = req.params;
      const tx: Transaction = req.body;
      recordTransactionAndReduceStock(storeId, tx);
      const updatedProducts = getProductsByStore(storeId);
      const updatedTransactions = getTransactionsByStore(storeId);
      res.status(201).json({
        ok: true,
        products: updatedProducts,
        transactions: updatedTransactions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cancel sale transaction and restore product stock atomically
  app.patch('/stores/:storeId/transactions/:transactionId/cancel', (req, res) => {
    try {
      const { storeId, transactionId } = req.params;
      cancelTransactionAndRestoreStock(storeId, transactionId);
      const updatedProducts = getProductsByStore(storeId);
      const updatedTransactions = getTransactionsByStore(storeId);
      res.json({
        ok: true,
        products: updatedProducts,
        transactions: updatedTransactions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear store transactions
  app.delete('/stores/:storeId/transactions', (req, res) => {
    try {
      const { storeId } = req.params;
      clearStoreTransactions(storeId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
