const { app, BrowserWindow, protocol, net, shell, session } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

// Register custom privileged scheme for 100% offline local IndexedDB & storage
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

app.name = 'Toko App';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Toko App',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Open external links (like WhatsApp or web links) in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.loadURL('app://localhost/');
}

app.whenReady().then(() => {
  // Allow webcam/camera permission for scanning / photographing stock
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Handle app:// protocol to serve Vite's dist bundle
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    let filePath = path.join(__dirname, '../dist', decodeURIComponent(url.pathname));
    if (url.pathname === '/' || !path.extname(filePath)) {
      filePath = path.join(__dirname, '../dist/index.html');
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
