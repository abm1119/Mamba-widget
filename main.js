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

let win;
let launcherWin;
let tray;

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
      contextIsolation: true
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
      contextIsolation: true
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
  new Notification({ 
    title, 
    body,
    icon: path.join(__dirname, "mamba.png")
  }).show();
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
