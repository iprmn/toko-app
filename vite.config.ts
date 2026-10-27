import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { createApiApp } from './server/api';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-plugin',
    configureServer(server) {
      const apiApp = createApiApp();
      server.middlewares.use('/api', apiApp);
    },
    configurePreviewServer(server) {
      const apiApp = createApiApp();
      server.middlewares.use('/api', apiApp);
    },
  };
}

function otaLiveSyncPlugin(): Plugin {
  return {
    name: 'ota-live-sync-plugin',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const assetsDir = path.join(distDir, 'assets');
      const indexHtmlPath = path.join(distDir, 'index.html');

      if (!fs.existsSync(assetsDir) || !fs.existsSync(indexHtmlPath)) return;

      const assetFiles = fs.readdirSync(assetsDir);
      const jsFile = assetFiles.find((f) => f.endsWith('.js'));
      const cssFile = assetFiles.find((f) => f.endsWith('.css'));

      if (!jsFile || !cssFile) return;

      const buildVersion = Date.now();
      const versionMeta = {
        version: buildVersion,
        js: `assets/${jsFile}`,
        css: `assets/${cssFile}`,
        builtAt: new Date(buildVersion).toISOString(),
      };

      // Write dist/version.json so GitHub Pages serves it with CORS enabled
      fs.writeFileSync(
        path.join(distDir, 'version.json'),
        JSON.stringify(versionMeta, null, 2),
        'utf8'
      );

      // Write dist/sw.js for 100% Offline iOS & Web PWA support
      const swContent = `const CACHE_NAME = "toko-app-pwa-v${buildVersion}";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/${jsFile}",
  "./assets/${cssFile}"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("toko-app-pwa-v") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Network-first for navigation / HTML and version.json so updates arrive immediately when online
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/version.json") ||
    url.pathname.endsWith("/toko-app/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Cache-first with network fallback for JS, CSS, icons, and fonts
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      });
    })
  );
});
`;
      fs.writeFileSync(path.join(distDir, 'sw.js'), swContent, 'utf8');

      // Transform dist/index.html to include the OTA Auto-Sync Bootstrap Loader
      let html = fs.readFileSync(indexHtmlPath, 'utf8');

      // Remove default static script & stylesheet tags for the main bundle
      html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>\s*/g, '');
      html = html.replace(/<link rel="stylesheet" crossorigin href="[^"]+">\s*/g, '');

      const otaLoaderScript = `<script>
(function() {
  var BUILTIN_VERSION = ${buildVersion};
  var BUILTIN_JS = "./assets/${jsFile}";
  var BUILTIN_CSS = "./assets/${cssFile}";
  var REMOTE_BASE = "https://iprmn.github.io/toko-app/";
  var OTA_DB_NAME = "toko_ota_cache_db";
  var OTA_STORE_NAME = "bundles";

  var isCapacitorApp = (
    window.location.protocol === "capacitor:" ||
    (window.location.hostname === "localhost" && !window.location.port)
  );

  function injectBuiltin() {
    window.__TOKO_ACTIVE_VERSION__ = BUILTIN_VERSION;
    window.__TOKO_ACTIVE_JS_PATH__ = "assets/${jsFile}";
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = BUILTIN_CSS;
    document.head.appendChild(link);

    var script = document.createElement("script");
    script.type = "module";
    script.src = BUILTIN_JS;
    document.head.appendChild(script);
  }

  // On web browser / iOS PWA (GitHub Pages or local dev server), load directly & register Offline Service Worker
  if (!isCapacitorApp) {
    injectBuiltin();
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      window.addEventListener("load", function() {
        navigator.serviceWorker.register("./sw.js").catch(function() {});
      });
    }
    return;
  }

  function openOtaDb() {
    return new Promise(function(resolve, reject) {
      try {
        var req = indexedDB.open(OTA_DB_NAME, 1);
        req.onupgradeneeded = function() {
          var db = req.result;
          if (!db.objectStoreNames.contains(OTA_STORE_NAME)) {
            db.createObjectStore(OTA_STORE_NAME);
          }
        };
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      } catch (e) {
        reject(e);
      }
    });
  }

  function getCachedBundle() {
    return openOtaDb().then(function(db) {
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(OTA_STORE_NAME, "readonly");
          var req = tx.objectStore(OTA_STORE_NAME).get("latest");
          req.onsuccess = function() { resolve(req.result || null); };
          req.onerror = function() { resolve(null); };
        } catch (e) {
          resolve(null);
        }
      });
    }).catch(function() { return null; });
  }

  function saveCachedBundle(bundle) {
    return openOtaDb().then(function(db) {
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(OTA_STORE_NAME, "readwrite");
          tx.objectStore(OTA_STORE_NAME).put(bundle, "latest");
          tx.oncomplete = function() { resolve(true); };
          tx.onerror = function() { resolve(false); };
        } catch (e) {
          resolve(false);
        }
      });
    }).catch(function() { return false; });
  }

  function injectOtaBundle(bundle) {
    window.__TOKO_ACTIVE_VERSION__ = bundle.version;
    if (bundle.jsPath) window.__TOKO_ACTIVE_JS_PATH__ = bundle.jsPath;
    var style = document.createElement("style");
    style.id = "toko-ota-css";
    style.textContent = bundle.css;
    document.head.appendChild(style);

    var blob = new Blob([bundle.js], { type: "text/javascript" });
    var blobUrl = URL.createObjectURL(blob);
    var script = document.createElement("script");
    script.type = "module";
    script.src = blobUrl;
    document.head.appendChild(script);
  }

  function fetchWithTimeout(url, timeoutMs) {
    return new Promise(function(resolve, reject) {
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = setTimeout(function() {
        if (controller) controller.abort();
        reject(new Error("timeout"));
      }, timeoutMs);

      fetch(url, {
        cache: "no-store",
        signal: controller ? controller.signal : undefined
      }).then(function(res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        resolve(res);
      }).catch(function(err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function checkAndDownloadRemote(minVersion, metaTimeoutMs, assetTimeoutMs) {
    if (!navigator.onLine) return Promise.resolve(null);
    var activeJsPath = window.__TOKO_ACTIVE_JS_PATH__ || "";
    var dlTimeout = assetTimeoutMs || metaTimeoutMs || 10000;
    var metaUrl = REMOTE_BASE + "version.json?t=" + Date.now();
    return fetchWithTimeout(metaUrl, metaTimeoutMs || 3500)
      .then(function(res) { return res.json(); })
      .then(function(meta) {
        if (!meta || !meta.version) {
          return null;
        }
        var isNewerVersion = meta.version > minVersion;
        var isDifferentHash = activeJsPath && meta.js && meta.js !== activeJsPath && meta.version >= minVersion - 120000;
        if (!isNewerVersion && !isDifferentHash) {
          return null;
        }
        return Promise.all([
          fetchWithTimeout(REMOTE_BASE + meta.css + "?v=" + meta.version, dlTimeout).then(function(r) { return r.text(); }),
          fetchWithTimeout(REMOTE_BASE + meta.js + "?v=" + meta.version, dlTimeout).then(function(r) { return r.text(); })
        ]).then(function(results) {
          var cssText = results[0];
          var jsText = results[1];
          if (!jsText || jsText.length < 1000) return null;
          var newBundle = {
            version: meta.version,
            jsPath: meta.js,
            css: cssText,
            js: jsText,
            updatedAt: Date.now()
          };
          return saveCachedBundle(newBundle).then(function() {
            return newBundle;
          });
        });
      })
      .catch(function() { return null; });
  }

  function isUserEditingInput() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = (el.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function showUpdateReadyBanner() {
    if (document.getElementById("toko-ota-banner")) return;
    var banner = document.createElement("button");
    banner.id = "toko-ota-banner";
    banner.type = "button";
    banner.style.cssText = "position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:9999;background:#065f46;color:#ffffff;font-family:sans-serif;font-size:12px;font-weight:700;padding:10px 16px;border-radius:9999px;border:1px solid #34d399;box-shadow:0 10px 25px rgba(0,0,0,0.25);display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;";
    banner.innerHTML = "<span style='width:8px;height:8px;border-radius:9999px;background:#34d399;display:inline-block;'></span><span>Memperbarui otomatis ke versi terbaru...</span>";
    banner.onclick = function() {
      window.location.reload();
    };
    document.body.appendChild(banner);
    if (!isUserEditingInput()) {
      setTimeout(function() {
        window.location.reload();
      }, 900);
    }
  }

  var isCheckingBg = false;
  function triggerBackgroundCheck() {
    if (isCheckingBg || !navigator.onLine) return;
    isCheckingBg = true;
    var activeVer = window.__TOKO_ACTIVE_VERSION__ || BUILTIN_VERSION;
    checkAndDownloadRemote(activeVer, 5000, 15000).then(function(newBundle) {
      isCheckingBg = false;
      if (newBundle && (newBundle.version > activeVer || (newBundle.jsPath && newBundle.jsPath !== window.__TOKO_ACTIVE_JS_PATH__))) {
        showUpdateReadyBanner();
      }
    }).catch(function() {
      isCheckingBg = false;
    });
  }

  // Startup flow for Android APK:
  getCachedBundle().then(function(cached) {
    var bestLocalVersion = (cached && cached.version > BUILTIN_VERSION) ? cached.version : BUILTIN_VERSION;
    if (cached && cached.version > BUILTIN_VERSION && cached.jsPath) {
      window.__TOKO_ACTIVE_JS_PATH__ = cached.jsPath;
    } else {
      window.__TOKO_ACTIVE_JS_PATH__ = "assets/${jsFile}";
    }

    // Try fast OTA metadata check on startup (3.5s) and allow up to 10s for downloading bundle if update exists
    checkAndDownloadRemote(bestLocalVersion, 3500, 10000).then(function(freshBundle) {
      if (freshBundle) {
        injectOtaBundle(freshBundle);
      } else if (cached && cached.version > BUILTIN_VERSION && cached.js && cached.css) {
        injectOtaBundle(cached);
        setTimeout(triggerBackgroundCheck, 3500);
      } else {
        injectBuiltin();
        setTimeout(triggerBackgroundCheck, 3500);
      }

      setInterval(triggerBackgroundCheck, 25000);
      window.addEventListener("online", triggerBackgroundCheck);
      document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
          triggerBackgroundCheck();
        }
      });
    });
  });
})();
</script>`;

      html = html.replace('</body>', `    ${otaLoaderScript}\n  </body>`);
      fs.writeFileSync(indexHtmlPath, html, 'utf8');

      // Generate dedicated public demo entrypoints (dist/demo.html and dist/demo/index.html)
      const demoHtml = html.replace(
        '<head>',
        '<head>\n    <script>window.__TOKO_FORCE_DEMO__ = true;</script>'
      );
      fs.writeFileSync(path.join(distDir, 'demo.html'), demoHtml, 'utf8');

      const demoSubDir = path.join(distDir, 'demo');
      if (!fs.existsSync(demoSubDir)) {
        fs.mkdirSync(demoSubDir, { recursive: true });
      }
      const demoRedirectHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Toko App — Demo Publik Interaktif</title>
  <script>
    window.location.replace("../?demo=1");
  </script>
</head>
<body></body>
</html>`;
      fs.writeFileSync(path.join(demoSubDir, 'index.html'), demoRedirectHtml, 'utf8');
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), sqliteApiPlugin(), otaLiveSyncPlugin()],
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          codeSplitting: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: ['**/database/**', '**/*.db', '**/*.db-wal', '**/*.db-shm'],
            },
    },
  };
});
