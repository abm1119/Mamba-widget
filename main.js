const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
  ipcMain,
  screen,
  Notification
} = require("electron");
const path = require("path");
const fs = require("fs");
const keytar = require("keytar");
const CryptoJS = require("crypto-js");

const SERVICE = "MambaWidget";
const ACCOUNT = "StorageKey";
const STORAGE_FILE = path.join(app.getPath("userData"), "tasks.enc");

// ---------------------------------------------------------
// ENCRYPTION HELPERS
// ---------------------------------------------------------
async function getEncryptionKey() {
  let key = await keytar.getPassword(SERVICE, ACCOUNT);
  if (!key) {
    key = require("crypto").randomBytes(32).toString("hex");
    await keytar.setPassword(SERVICE, ACCOUNT, key);
  }
  return key;
}

// ---------------------------------------------------------
// AUTO-LAUNCH
// ---------------------------------------------------------
app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: false
  });
});

// ---------------------------------------------------------
// MAIN WIDGET WINDOW
// ---------------------------------------------------------
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 380,
    height: 520,
    x: screenWidth - 400,
    y: screenHeight - 650, // Adjusted to be above the taskbar area
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile("index.html");

  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

// ---------------------------------------------------------
// FLOATING LAUNCHER WINDOW
// ---------------------------------------------------------
function createLauncher() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  launcherWin = new BrowserWindow({
    width: 80,
    height: 80,
    x: screenWidth - 100,
    y: screenHeight - 100,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true
    }
  });

  launcherWin.loadFile("icon.html");
}

// ---------------------------------------------------------
// IPC HANDLERS
// ---------------------------------------------------------
ipcMain.on("toggle-widget", () => {
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
  }
});

ipcMain.on("show-notification", (event, { title, body }) => {
  // Strict validation of IPC payload
  const safeTitle = typeof title === 'string' ? title.substring(0, 100) : 'Notification';
  const safeBody = typeof body === 'string' ? body.substring(0, 500) : '';

  new Notification({ 
    title: safeTitle, 
    body: safeBody,
    icon: path.join(__dirname, "mamba.png")
  }).show();
});

ipcMain.on("save-tasks", async (event, tasks) => {
  const key = await getEncryptionKey();
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(tasks), key).toString();
  fs.writeFileSync(STORAGE_FILE, encrypted);
});

ipcMain.handle("load-tasks", async () => {
  if (!fs.existsSync(STORAGE_FILE)) return [];
  
  const key = await getEncryptionKey();
  const encrypted = fs.readFileSync(STORAGE_FILE, "utf-8");
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (e) {
    console.error("Failed to decrypt tasks:", e);
    return [];
  }
});

// ---------------------------------------------------------
// TRAY ICON
// ---------------------------------------------------------
function createTray() {
  const iconPath = path.join(__dirname, "mamba.png");
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Toggle Widget",
      click: () => {
        if (win.isVisible()) win.hide();
        else win.show();
      }
    },
    { type: "separator" },
    {
      label: "Quit Mamba",
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Mamba Widget");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (win.isVisible()) win.hide();
    else {
      win.show();
      win.focus();
    }
  });
}

// ---------------------------------------------------------
// GLOBAL SHORTCUT
// ---------------------------------------------------------
function registerShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+T", () => {
    if (win.isVisible()) win.hide();
    else win.show();
  });
}

// ---------------------------------------------------------
// APP LIFECYCLE
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();
  createLauncher();
  createTray();
  registerShortcuts();

  win.once("ready-to-show", () => {
    win.show();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createLauncher();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
