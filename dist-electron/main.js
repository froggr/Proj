"use strict";
const { app, BrowserWindow, ipcMain, screen, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
console.log("Forcing X11/XWayland for Wayland compatibility");
app.commandLine.appendSwitch("--ozone-platform=x11");
app.commandLine.appendSwitch("--no-sandbox");
console.log("Using X11 mode with hardware acceleration enabled");
let mainWindow = null;
let projectorWindow = null;
const isDev = process.env.NODE_ENV !== "production";
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
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
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Main window finished loading");
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
  const displays = screen.getAllDisplays();
  console.log("Available displays:", displays.length);
  let targetDisplay = displays[0];
  if (monitorIndex !== null && displays[monitorIndex]) {
    targetDisplay = displays[monitorIndex];
  }
  const { x, y, width, height } = targetDisplay.bounds;
  projectorWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    },
    title: "DongleControl Projector - Projector"
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
  return displays.map(
    (display, index) => `Monitor ${index + 1} - ${display.size.width}x${display.size.height}`
  );
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
app.whenReady().then(() => {
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
