import { app, BrowserWindow } from 'electron';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This is just a typical pattern – not required, but often included.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Usually disabled for security
      contextIsolation: true, // Also recommended for security
    },
  });

  // 1) During development, load the local dev server from Vite
  //    This assumes your web workspace is named "web" and is running on port 5173
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // 2) For production, load the local index.html of the build
    mainWindow.loadFile(path.join(__dirname, '../web-dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, usually apps continue running until user quits explicitly
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // Re-create window when dock icon is clicked (macOS)
  if (mainWindow === null) createWindow();
});
