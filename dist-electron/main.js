"use strict";
const { app, BrowserWindow, ipcMain, screen, dialog, Menu, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
console.log("Forcing X11/XWayland for Wayland compatibility");
app.commandLine.appendSwitch("--ozone-platform=x11");
app.commandLine.appendSwitch("--no-sandbox");
app.commandLine.appendSwitch("--disable-setuid-sandbox");
console.log("Using X11 mode with hardware acceleration enabled");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-image",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
]);
let mainWindow = null;
let projectorWindow = null;
const isDev = !app.isPackaged;
console.log("=================================");
console.log("app.isPackaged:", app.isPackaged);
console.log("Development mode:", isDev);
console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
console.log("process.argv:", process.argv);
console.log("=================================");
if (isDev) {
  app.commandLine.appendSwitch("--disable-features=OutOfBlinkCors");
}
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    // Frameless window for custom title bar
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "DongleControl Projector"
  });
  const template = [
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  if (isDev) {
    const vitePort = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    console.log("Loading main window from:", vitePort);
    mainWindow.loadURL(vitePort);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Main window finished loading");
    if (isDev) {
      console.log("Attempting to open DevTools...");
      setTimeout(() => {
        console.log("Trying to open DevTools (attempt 1)...");
        mainWindow.webContents.openDevTools();
      }, 100);
      setTimeout(() => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
          console.log("Trying to open DevTools (attempt 2 - detached)...");
          mainWindow.webContents.openDevTools({ mode: "detach" });
        }
      }, 500);
      setTimeout(() => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
          console.log("Trying to open DevTools (attempt 3 - undocked)...");
          mainWindow.webContents.openDevTools({ mode: "undocked" });
        }
      }, 1e3);
    }
  });
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Main window failed to load:", errorCode, errorDescription);
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    if (input.key === "F12") {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function createProjectorWindow(monitorIndex = null) {
  console.log("=====================================");
  console.log("Opening projector window (Wayland-compatible mode)");
  console.log("Instructions:");
  console.log("  1. Drag the window to your projector/display");
  console.log("  2. Press F11 to toggle fullscreen");
  console.log("  3. Press Escape to exit fullscreen");
  console.log("=====================================");
  projectorWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: true,
    // Keep frame so you can drag it
    fullscreen: false,
    skipTaskbar: false,
    // Show in taskbar so it's easier to find
    show: false,
    alwaysOnTop: true,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    },
    title: "DongleControl Projector - Drag me to display, then press F11"
  });
  projectorWindow.once("ready-to-show", () => {
    projectorWindow.show();
    console.log("✓ Projector window opened");
    console.log("📌 Drag it to your target display, then press F11 for fullscreen");
  });
  projectorWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11" && input.type === "keyDown") {
      const isFullScreen = projectorWindow.isFullScreen();
      projectorWindow.setFullScreen(!isFullScreen);
      console.log(isFullScreen ? "📺 Exited fullscreen" : "📺 Entered fullscreen");
      event.preventDefault();
    }
    if (input.key === "Escape" && input.type === "keyDown") {
      if (projectorWindow.isFullScreen()) {
        projectorWindow.setFullScreen(false);
        console.log("📺 Exited fullscreen");
        event.preventDefault();
      }
    }
  });
  if (isDev) {
    const vitePort = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    projectorWindow.loadURL(vitePort + "/projector");
  } else {
    projectorWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/projector"
    });
  }
  projectorWindow.on("closed", () => {
    projectorWindow = null;
  });
  return projectorWindow;
}
ipcMain.handle("get-available-monitors", () => {
  const displays = screen.getAllDisplays();
  console.log(`IPC: get-available-monitors returning ${displays.length} displays`);
  const monitors = displays.map((display, index) => {
    const isPrimary = display.id === screen.getPrimaryDisplay().id;
    return `Monitor ${index + 1}${isPrimary ? " (Primary)" : ""} - ${display.bounds.width}x${display.bounds.height}`;
  });
  console.log("Available monitors:", monitors);
  return monitors;
});
ipcMain.handle("open-projector-window", (event, monitorIndex) => {
  if (projectorWindow) {
    projectorWindow.focus();
    return { success: true };
  }
  try {
    createProjectorWindow(monitorIndex);
    return { success: true };
  } catch (error) {
    console.error("Failed to open projector:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("close-projector-window", () => {
  if (projectorWindow) {
    projectorWindow.close();
    projectorWindow = null;
  }
  return { success: true };
});
ipcMain.handle("update-projector", (event, slideData) => {
  console.log("Main: Received update-projector, data length:", slideData.length);
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    console.log("Main: Sending to projector window");
    projectorWindow.webContents.send("update-slide", slideData);
    return { success: true };
  } else {
    console.log("Main: Projector window not available");
    return { success: false, error: "Projector window not open" };
  }
});
ipcMain.on("video-ended", () => {
  console.log("Main: Video ended notification from projector, forwarding to control window");
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("video-ended-notification");
  }
});
ipcMain.handle("window-minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});
ipcMain.handle("window-maximize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle("window-close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});
ipcMain.handle("save-presentation", async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: "Save Presentation",
      defaultPath: "presentation.json",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, data, "utf-8");
      return { success: true, filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error("Save failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("load-presentation", async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: "Load Presentation",
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ],
      properties: ["openFile"]
    });
    if (!canceled && filePaths.length > 0) {
      const data = fs.readFileSync(filePaths[0], "utf-8");
      return { success: true, data };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error("Load failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("select-images", async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: "Select Images",
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] }
      ],
      properties: ["openFile", "multiSelections"]
      // Allow multiple files
    });
    if (!canceled && filePaths.length > 0) {
      return { success: true, files: filePaths };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error("Image selection failed:", error);
    return { success: false, error: error.message };
  }
});
app.whenReady().then(() => {
  protocol.registerFileProtocol("local-image", (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace("local-image://", ""));
    console.log("Loading local image:", filePath);
    try {
      if (fs.existsSync(filePath)) {
        callback({ path: filePath });
      } else {
        console.error("Image file not found:", filePath);
        callback({ error: -6 });
      }
    } catch (error) {
      console.error("Error loading image:", error);
      callback({ error: -2 });
    }
  });
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
