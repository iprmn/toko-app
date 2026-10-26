import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent pinch-to-zoom and multi-touch zoom gestures on mobile & tablet devices
if (typeof window !== 'undefined') {
  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // Automatic OTA update applier for installed Android APKs
  const isCapApp =
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port);

  if (isCapApp) {
    const isEditingField = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = (el.tagName || '').toUpperCase();
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const checkAndAutoApplyOta = async () => {
      try {
        // If the host index.html OTA script already created the update banner, auto-apply it
        const existingBanner = document.getElementById('toko-ota-banner');
        if (existingBanner && !isEditingField()) {
          window.location.reload();
          return;
        }

        if (!navigator.onLine) return;
        const activeVer = Number((window as unknown as { __TOKO_ACTIVE_VERSION__?: number }).__TOKO_ACTIVE_VERSION__ || 0);
        if (!activeVer) return;

        const remoteBase = 'https://iprmn.github.io/toko-app/';
        const res = await fetch(`${remoteBase}version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const meta = await res.json();
        if (!meta || !meta.version || meta.version <= activeVer) return;

        const [cssText, jsText] = await Promise.all([
          fetch(`${remoteBase}${meta.css}?v=${meta.version}`, { cache: 'no-store' }).then((r) => r.text()),
          fetch(`${remoteBase}${meta.js}?v=${meta.version}`, { cache: 'no-store' }).then((r) => r.text()),
        ]);

        if (!jsText || jsText.length < 1000) return;

        await new Promise<void>((resolve) => {
          const req = indexedDB.open('toko_ota_cache_db', 1);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('bundles')) {
              db.createObjectStore('bundles');
            }
          };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('bundles', 'readwrite');
            tx.objectStore('bundles').put(
              {
                version: meta.version,
                jsPath: meta.js,
                css: cssText,
                js: jsText,
                updatedAt: Date.now(),
              },
              'latest'
            );
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          };
          req.onerror = () => resolve();
        });

        if (!isEditingField()) {
          window.location.reload();
        }
      } catch {
        // Ignore transient offline/network errors
      }
    };

    setInterval(checkAndAutoApplyOta, 20000);
    window.addEventListener('focus', checkAndAutoApplyOta);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndAutoApplyOta();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
