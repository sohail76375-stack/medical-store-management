const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let backend;
let mainWindow;

function waitForServer(server) {
  return new Promise((resolve, reject) => {
    if (server.listening) return resolve(server.address().port);
    const onError = (error) => { server.off('listening', onListening); reject(error); };
    const onListening = () => { server.off('error', onError); resolve(server.address().port); };
    server.once('error', onError);
    server.once('listening', onListening);
  });
}

async function createWindow() {
  const dataDirectory = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDirectory, { recursive: true });
  process.env.MEDICAL_STORE_DATA_DIR = dataDirectory;
  process.env.MEDICAL_STORE_HOST = '127.0.0.1';
  process.env.PORT = '0'; // Choose an available local port to avoid conflicts.

  try {
    backend = require('./server');
    const port = await waitForServer(backend.server);
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 680,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#0f172a',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) shell.openExternal(url);
      return { action: 'deny' };
    });
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    mainWindow.on('closed', () => { mainWindow = null; });
  } catch (error) {
    console.error('Could not start Medical Store:', error);
    dialog.showErrorBox('Medical Store could not start', `${error.message}\n\nPlease reinstall the app or contact support.`);
    app.quit();
  }
}

app.whenReady().then(createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('before-quit', () => {
  if (backend?.server?.listening) backend.server.close();
  try { backend?.db?.close(); } catch (_) {}
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
