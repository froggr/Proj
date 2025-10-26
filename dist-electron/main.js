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
  mainWindow.on("close", () => {
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
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
ipcMain.on("control-projector-video", (event, command, data) => {
  console.log("Main: Video control command from control window:", command, data);
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.webContents.send("video-control-command", command, data);
  }
});
ipcMain.on("video-state-update", (event, state) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("video-state-notification", state);
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
ipcMain.handle("create-library", async (event, parentPath, libraryName) => {
  try {
    const libraryPath = path.join(parentPath, `${libraryName}.dclib`);
    fs.mkdirSync(libraryPath, { recursive: true });
    fs.mkdirSync(path.join(libraryPath, "assets", "branding"), { recursive: true });
    fs.mkdirSync(path.join(libraryPath, "assets", "media"), { recursive: true });
    fs.mkdirSync(path.join(libraryPath, "assets", ".trash"), { recursive: true });
    fs.mkdirSync(path.join(libraryPath, "events"), { recursive: true });
    const metadata = {
      name: libraryName,
      created: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0",
      lastOpened: (/* @__PURE__ */ new Date()).toISOString()
    };
    fs.writeFileSync(
      path.join(libraryPath, "library.json"),
      JSON.stringify(metadata, null, 2),
      "utf-8"
    );
    return libraryPath;
  } catch (error) {
    console.error("Create library failed:", error);
    return null;
  }
});
ipcMain.handle("load-library-metadata", async (event, libPath) => {
  try {
    const metadataPath = path.join(libPath, "library.json");
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, "utf-8");
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Load library metadata failed:", error);
    return null;
  }
});
ipcMain.handle("save-library-metadata", async (event, libPath, metadata) => {
  try {
    const metadataPath = path.join(libPath, "library.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Save library metadata failed:", error);
    return false;
  }
});
ipcMain.handle("list-library-events", async (event, libPath) => {
  try {
    const eventsPath = path.join(libPath, "events");
    if (!fs.existsSync(eventsPath)) {
      return [];
    }
    const files = fs.readdirSync(eventsPath);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort();
  } catch (error) {
    console.error("List library events failed:", error);
    return [];
  }
});
ipcMain.handle("create-library-event", async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, "events", `${eventName}.json`);
    const emptyEvent = {
      title: eventName,
      stacks: []
    };
    fs.writeFileSync(eventPath, JSON.stringify(emptyEvent, null, 2), "utf-8");
    return eventPath;
  } catch (error) {
    console.error("Create library event failed:", error);
    return null;
  }
});
ipcMain.handle("load-library-event", async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, "events", `${eventName}.json`);
    if (!fs.existsSync(eventPath)) {
      return { success: false, error: "Event not found" };
    }
    const data = fs.readFileSync(eventPath, "utf-8");
    return { success: true, data: JSON.parse(data), path: eventPath };
  } catch (error) {
    console.error("Load library event failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("save-library-event", async (event, eventPath, data) => {
  try {
    fs.writeFileSync(eventPath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Save library event failed:", error);
    return false;
  }
});
ipcMain.handle("delete-library-event", async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, "events", `${eventName}.json`);
    if (!fs.existsSync(eventPath)) {
      return false;
    }
    fs.unlinkSync(eventPath);
    return true;
  } catch (error) {
    console.error("Delete library event failed:", error);
    return false;
  }
});
ipcMain.handle("resolve-asset-path", async (event, libPath, assetUrl) => {
  try {
    if (!assetUrl.startsWith("assets://")) {
      return assetUrl;
    }
    const relativePath = assetUrl.replace("assets://", "assets/");
    const fullPath = path.join(libPath, relativePath);
    if (fs.existsSync(fullPath)) {
      return `local-image://${fullPath}`;
    }
    const trashPath = fullPath.replace("/assets/", "/assets/.trash/");
    if (fs.existsSync(trashPath)) {
      return trashPath;
    }
    return null;
  } catch (error) {
    console.error("Resolve asset path failed:", error);
    return null;
  }
});
ipcMain.handle("select-library-folder", async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: "Select Library Folder",
      properties: ["openDirectory"]
    });
    if (!canceled && filePaths.length > 0) {
      return { success: true, path: filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error("Select library folder failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("list-library-assets", async (event, libPath) => {
  try {
    let scanDirectory2 = function(dirPath, urlPrefix) {
      if (!fs.existsSync(dirPath)) return;
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          if (item.name === ".trash") continue;
          const subPath = path.join(dirPath, item.name);
          const subUrlPrefix = `${urlPrefix}${item.name}/`;
          scanDirectory2(subPath, subUrlPrefix);
        } else if (item.isFile()) {
          const ext = item.name.split(".").pop().toLowerCase();
          const assetPath = path.join(dirPath, item.name);
          const assetUrl = `${urlPrefix}${item.name}`;
          let assetType = null;
          if (imageExtensions.includes(ext)) {
            assetType = "image";
          } else if (videoExtensions.includes(ext)) {
            assetType = "video";
          }
          if (assetType) {
            assets.push({
              filename: item.name,
              path: assetPath,
              url: assetUrl,
              type: assetType
            });
          }
        }
      }
    };
    var scanDirectory = scanDirectory2;
    if (!libPath) {
      return { success: false, assets: [] };
    }
    const assets = [];
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
    const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
    const brandingPath = path.join(libPath, "assets", "branding");
    scanDirectory2(brandingPath, "assets://branding/");
    const mediaPath = path.join(libPath, "assets", "media");
    scanDirectory2(mediaPath, "assets://media/");
    return { success: true, assets };
  } catch (error) {
    console.error("List library assets failed:", error);
    return { success: false, assets: [], error: error.message };
  }
});
ipcMain.handle("import-assets-to-library", async (event, libPath, assetType) => {
  try {
    if (!libPath) {
      return { success: false, error: "No library open" };
    }
    let filters = [];
    if (assetType === "image") {
      filters = [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] }];
    } else if (assetType === "video") {
      filters = [{ name: "Videos", extensions: ["mp4", "webm", "ogg", "mov", "avi", "mkv"] }];
    } else {
      filters = [
        { name: "Media Files", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "mp4", "webm", "ogg", "mov", "avi", "mkv"] }
      ];
    }
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: "Import Assets",
      filters,
      properties: ["openFile", "multiSelections"]
    });
    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    const now = /* @__PURE__ */ new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetDir = path.join(libPath, "assets", "media", yearMonth);
    fs.mkdirSync(targetDir, { recursive: true });
    const importedAssets = [];
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
    const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
    for (const sourcePath of filePaths) {
      const filename = path.basename(sourcePath);
      const targetPath = path.join(targetDir, filename);
      fs.copyFileSync(sourcePath, targetPath);
      const ext = filename.split(".").pop().toLowerCase();
      let type = "unknown";
      if (imageExtensions.includes(ext)) {
        type = "image";
      } else if (videoExtensions.includes(ext)) {
        type = "video";
      }
      const assetUrl = `assets://media/${yearMonth}/${filename}`;
      importedAssets.push({
        filename,
        path: targetPath,
        url: assetUrl,
        type
      });
    }
    return { success: true, assets: importedAssets };
  } catch (error) {
    console.error("Import assets failed:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("check-asset-usage", async (event, libPath, assetUrl) => {
  try {
    if (!libPath || !assetUrl) {
      return [];
    }
    const eventsDir = path.join(libPath, "events");
    if (!fs.existsSync(eventsDir)) {
      return [];
    }
    const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".json"));
    const usageList = [];
    for (const eventFile of eventFiles) {
      const eventPath = path.join(eventsDir, eventFile);
      try {
        const content = fs.readFileSync(eventPath, "utf-8");
        if (content.includes(assetUrl)) {
          const eventName = eventFile.replace(".json", "");
          usageList.push(eventName);
        }
      } catch (error) {
        console.error(`Error reading event file ${eventFile}:`, error);
      }
    }
    return usageList;
  } catch (error) {
    console.error("Check asset usage failed:", error);
    return [];
  }
});
ipcMain.handle("delete-library-asset", async (event, libPath, assetPath) => {
  try {
    if (!libPath || !assetPath) {
      return { success: false, error: "Invalid parameters" };
    }
    if (!assetPath.startsWith(libPath)) {
      return { success: false, error: "Asset path is not within library" };
    }
    if (!fs.existsSync(assetPath)) {
      return { success: false, error: "Asset file not found" };
    }
    fs.unlinkSync(assetPath);
    console.log("Asset deleted:", assetPath);
    return { success: true };
  } catch (error) {
    console.error("Delete asset failed:", error);
    return { success: false, error: error.message };
  }
});
app.whenReady().then(() => {
  protocol.registerFileProtocol("local-image", (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace("local-image://", ""));
    try {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          ".mp4": "video/mp4",
          ".webm": "video/webm",
          ".ogg": "video/ogg",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".webp": "image/webp"
        };
        const mimeType = mimeTypes[ext];
        if (mimeType) {
          callback({
            path: filePath,
            headers: {
              "Content-Type": mimeType,
              "Accept-Ranges": "bytes"
            }
          });
        } else {
          callback({ path: filePath });
        }
      } else {
        console.error("Asset file not found:", filePath);
        callback({ error: -6 });
      }
    } catch (error) {
      console.error("Error loading asset:", filePath, error);
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
