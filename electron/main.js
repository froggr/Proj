const { app, BrowserWindow, ipcMain, screen, dialog, Menu, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const { setupRemoteServer, broadcastStateUpdate, closeRemoteServer } = require('./remoteServer')

// Force X11 instead of Wayland for better compatibility (especially with Cosmic DE)
console.log('Forcing X11/XWayland for Wayland compatibility')
app.commandLine.appendSwitch('--ozone-platform=x11')

// Disable sandbox for Wayland/Cosmic compatibility
app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('--disable-setuid-sandbox')

console.log('Using X11 mode with hardware acceleration enabled')

// Register custom protocol as privileged (before app ready)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-image',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
])

// Keep references to windows to prevent garbage collection
let mainWindow = null
let projectorWindow = null

// Setup global function for remote server to send events to main window
global.sendToMainWindow = (event, data) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(event, data)
  }
}

// Setup application menu (required for Mac keyboard shortcuts to work)
function setupApplicationMenu() {
  const isMac = process.platform === 'darwin'

  const template = [
    // App menu (Mac only)
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            const targetWindow = projectorWindow || mainWindow
            if (targetWindow && !targetWindow.isDestroyed()) {
              targetWindow.setFullScreen(!targetWindow.isFullScreen())
            }
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Determine if we're in development mode
const isDev = !app.isPackaged
console.log('=================================')
console.log('app.isPackaged:', app.isPackaged)
console.log('Development mode:', isDev)
console.log('process.env.NODE_ENV:', process.env.NODE_ENV)
console.log('process.argv:', process.argv)
console.log('=================================')

// Disable web security in dev mode to allow DevTools (ONLY in dev)
if (isDev) {
  app.commandLine.appendSwitch('--disable-features=OutOfBlinkCors')
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    fullscreenable: true,
    simpleFullscreen: false, // Use native macOS fullscreen
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    title: 'DCProjector'
  })

  // Create application menu with dev tools
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  if (isDev) {
    // Use environment variable for Vite port, fallback to 5173
    const vitePort = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    console.log('Loading main window from:', vitePort)
    mainWindow.loadURL(vitePort)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading')
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Main window failed to load:', errorCode, errorDescription)
  })

  // Keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  mainWindow.on('close', () => {
    // Close projector window when main window closes
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    // Quit the app when main window is closed
    app.quit()
  })
}

function createProjectorWindow(monitorIndex = null) {
  console.log('=====================================')
  console.log('Opening projector window (Wayland-compatible mode)')
  console.log('Instructions:')
  console.log('  1. Drag the window to your projector/display')
  console.log('  2. Press F11 to toggle fullscreen')
  console.log('  3. Press Escape to exit fullscreen')
  console.log('=====================================')

  projectorWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: true,
    fullscreen: false,
    fullscreenable: true,
    simpleFullscreen: false, // Use native macOS fullscreen
    skipTaskbar: false,
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    title: 'DCProjector'
  })

  projectorWindow.once('ready-to-show', () => {
    projectorWindow.show()
  })

  // Keyboard shortcuts for fullscreen
  projectorWindow.webContents.on('before-input-event', (event, input) => {
    const isMac = process.platform === 'darwin'

    // F11 (Windows/Linux) or Ctrl+Cmd+F (Mac) to toggle fullscreen
    const isFullscreenShortcut = (input.key === 'F11' && !isMac) ||
                                  (input.key === 'f' && input.control && input.meta && isMac)

    if (isFullscreenShortcut && input.type === 'keyDown') {
      const isFullScreen = projectorWindow.isFullScreen()
      projectorWindow.setFullScreen(!isFullScreen)
      console.log(isFullScreen ? '📺 Exited fullscreen' : '📺 Entered fullscreen')
      event.preventDefault()
    }

    // Escape to exit fullscreen
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (projectorWindow.isFullScreen()) {
        projectorWindow.setFullScreen(false)
        console.log('📺 Exited fullscreen')
        event.preventDefault()
      }
    }
  })

  if (isDev) {
    const vitePort = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    projectorWindow.loadURL(vitePort + '/projector')
  } else {
    projectorWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/projector'
    })
  }

  projectorWindow.on('closed', () => {
    projectorWindow = null
  })

  return projectorWindow
}

// IPC Handlers
ipcMain.handle('get-available-monitors', () => {
  const displays = screen.getAllDisplays()
  console.log(`IPC: get-available-monitors returning ${displays.length} displays`)
  const monitors = displays.map((display, index) => {
    const isPrimary = display.id === screen.getPrimaryDisplay().id
    return `Monitor ${index + 1}${isPrimary ? ' (Primary)' : ''} - ${display.bounds.width}x${display.bounds.height}`
  })
  console.log('Available monitors:', monitors)
  return monitors
})

ipcMain.handle('open-projector-window', (event, monitorIndex) => {
  if (projectorWindow) {
    projectorWindow.focus()
    return { success: true }
  }

  try {
    createProjectorWindow(monitorIndex)
    return { success: true }
  } catch (error) {
    console.error('Failed to open projector:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('close-projector-window', () => {
  if (projectorWindow) {
    projectorWindow.close()
    projectorWindow = null
  }
  return { success: true }
})

ipcMain.handle('update-projector', (event, slideData) => {
  console.log('Main: Received update-projector, data length:', slideData.length)
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    console.log('Main: Sending to projector window')
    projectorWindow.webContents.send('update-slide', slideData)
    return { success: true }
  } else {
    console.log('Main: Projector window not available')
    return { success: false, error: 'Projector window not open' }
  }
})

// Video completion notification from projector to control window
ipcMain.on('video-ended', () => {
  console.log('Main: Video ended notification from projector, forwarding to control window')
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('video-ended-notification')
  }
})

// Video playback control from control window to projector
ipcMain.on('control-projector-video', (event, command, data) => {
  console.log('Main: Video control command from control window:', command, data)
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.webContents.send('video-control-command', command, data)
  }
})

// Video playback state updates from projector to control window
ipcMain.on('video-state-update', (event, state) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('video-state-notification', state)
  }
})

// Window control handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close()
  }
})

// File dialog handlers
ipcMain.handle('save-presentation', async (event, data) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Presentation',
      defaultPath: 'presentation.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, data, 'utf-8')
      return { success: true, filePath }
    }
    return { success: false, canceled: true }
  } catch (error) {
    console.error('Save failed:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-presentation', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Presentation',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (!canceled && filePaths.length > 0) {
      const data = fs.readFileSync(filePaths[0], 'utf-8')
      return { success: true, data }
    }
    return { success: false, canceled: true }
  } catch (error) {
    console.error('Load failed:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('select-images', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Images',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }
      ],
      properties: ['openFile', 'multiSelections']  // Allow multiple files
    })

    if (!canceled && filePaths.length > 0) {
      return { success: true, files: filePaths }
    }
    return { success: false, canceled: true }
  } catch (error) {
    console.error('Image selection failed:', error)
    return { success: false, error: error.message }
  }
})

// Library management handlers
ipcMain.handle('create-library', async (event, parentPath, libraryName) => {
  try {
    const libraryPath = path.join(parentPath, `${libraryName}.dclib`)

    // Create library folder structure
    fs.mkdirSync(libraryPath, { recursive: true })
    fs.mkdirSync(path.join(libraryPath, 'assets', 'branding'), { recursive: true })
    fs.mkdirSync(path.join(libraryPath, 'assets', 'media'), { recursive: true })
    fs.mkdirSync(path.join(libraryPath, 'assets', '.trash'), { recursive: true })
    fs.mkdirSync(path.join(libraryPath, 'events'), { recursive: true })

    // Create library.json
    const metadata = {
      name: libraryName,
      created: new Date().toISOString(),
      version: '1.0',
      lastOpened: new Date().toISOString()
    }
    fs.writeFileSync(
      path.join(libraryPath, 'library.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    )

    return libraryPath
  } catch (error) {
    console.error('Create library failed:', error)
    return null
  }
})

ipcMain.handle('load-library-metadata', async (event, libPath) => {
  try {
    const metadataPath = path.join(libPath, 'library.json')
    if (fs.existsSync(metadataPath)) {
      const data = fs.readFileSync(metadataPath, 'utf-8')
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Load library metadata failed:', error)
    return null
  }
})

ipcMain.handle('save-library-metadata', async (event, libPath, metadata) => {
  try {
    const metadataPath = path.join(libPath, 'library.json')
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Save library metadata failed:', error)
    return false
  }
})

ipcMain.handle('list-library-events', async (event, libPath) => {
  try {
    const eventsPath = path.join(libPath, 'events')
    if (!fs.existsSync(eventsPath)) {
      return []
    }

    const files = fs.readdirSync(eventsPath)
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
      .sort()
  } catch (error) {
    console.error('List library events failed:', error)
    return []
  }
})

ipcMain.handle('create-library-event', async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, 'events', `${eventName}.json`)

    // Create empty event with default structure
    const emptyEvent = {
      title: eventName,
      stacks: []
    }

    fs.writeFileSync(eventPath, JSON.stringify(emptyEvent, null, 2), 'utf-8')
    return eventPath
  } catch (error) {
    console.error('Create library event failed:', error)
    return null
  }
})

ipcMain.handle('load-library-event', async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, 'events', `${eventName}.json`)

    if (!fs.existsSync(eventPath)) {
      return { success: false, error: 'Event not found' }
    }

    const data = fs.readFileSync(eventPath, 'utf-8')
    return { success: true, data: JSON.parse(data), path: eventPath }
  } catch (error) {
    console.error('Load library event failed:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-library-event', async (event, eventPath, data) => {
  try {
    fs.writeFileSync(eventPath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Save library event failed:', error)
    return false
  }
})

ipcMain.handle('delete-library-event', async (event, libPath, eventName) => {
  try {
    const eventPath = path.join(libPath, 'events', `${eventName}.json`)

    if (!fs.existsSync(eventPath)) {
      return false
    }

    fs.unlinkSync(eventPath)
    return true
  } catch (error) {
    console.error('Delete library event failed:', error)
    return false
  }
})

ipcMain.handle('resolve-asset-path', async (event, libPath, assetUrl) => {
  try {
    // Handle existing local-image:// URLs (for backward compatibility)
    if (assetUrl.startsWith('local-image://')) {
      return assetUrl
    }
    
    // Handle file:// URLs (convert to local-image://)
    if (assetUrl.startsWith('file://')) {
      let filePath = assetUrl.replace('file://', '')
      // On Windows, file:// URLs might have an extra slash
      if (process.platform === 'win32' && filePath.startsWith('/')) {
        filePath = filePath.substring(1)
      }
      return `local-image://${filePath}`
    }
    
    if (!assetUrl.startsWith('assets://')) {
      return assetUrl
    }

    // Convert assets://media/2025-01/video.mp4 to full path
    const relativePath = assetUrl.replace('assets://', 'assets/')
    const fullPath = path.join(libPath, relativePath)

    // Check if exists
    if (fs.existsSync(fullPath)) {
      // On Windows, ensure we use forward slashes in the URL
      // The protocol handler will convert them back as needed
      const urlPath = process.platform === 'win32' ? fullPath.replace(/\\/g, '/') : fullPath
      return `local-image://${urlPath}`
    }

    // Check in trash
    const trashPath = fullPath.replace('/assets/', '/assets/.trash/')
    if (fs.existsSync(trashPath)) {
      return trashPath
    }

    return null
  } catch (error) {
    console.error('Resolve asset path failed:', error)
    return null
  }
})

ipcMain.handle('select-library-folder', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Library Folder',
      properties: ['openDirectory']
    })

    if (!canceled && filePaths.length > 0) {
      return { success: true, path: filePaths[0] }
    }
    return { success: false, canceled: true }
  } catch (error) {
    console.error('Select library folder failed:', error)
    return { success: false, error: error.message }
  }
})

// List all assets in the library
ipcMain.handle('list-library-assets', async (event, libPath) => {
  try {
    if (!libPath) {
      return { success: false, assets: [] }
    }

    const assets = []
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']

    // Helper function to recursively scan directories
    function scanDirectory(dirPath, urlPrefix) {
      if (!fs.existsSync(dirPath)) return

      const items = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const item of items) {
        if (item.isDirectory()) {
          // Skip trash folder
          if (item.name === '.trash') continue

          // Recursively scan subdirectories
          const subPath = path.join(dirPath, item.name)
          const subUrlPrefix = `${urlPrefix}${item.name}/`
          scanDirectory(subPath, subUrlPrefix)
        } else if (item.isFile()) {
          const ext = item.name.split('.').pop().toLowerCase()
          const assetPath = path.join(dirPath, item.name)
          const assetUrl = `${urlPrefix}${item.name}`

          let assetType = null
          if (imageExtensions.includes(ext)) {
            assetType = 'image'
          } else if (videoExtensions.includes(ext)) {
            assetType = 'video'
          }

          if (assetType) {
            assets.push({
              filename: item.name,
              path: assetPath,
              url: assetUrl,
              type: assetType
            })
          }
        }
      }
    }

    // Scan branding folder
    const brandingPath = path.join(libPath, 'assets', 'branding')
    scanDirectory(brandingPath, 'assets://branding/')

    // Scan media folder
    const mediaPath = path.join(libPath, 'assets', 'media')
    scanDirectory(mediaPath, 'assets://media/')

    return { success: true, assets }
  } catch (error) {
    console.error('List library assets failed:', error)
    return { success: false, assets: [], error: error.message }
  }
})

// Import assets into library with date-based organization
ipcMain.handle('import-assets-to-library', async (event, libPath, assetType) => {
  try {
    if (!libPath) {
      return { success: false, error: 'No library open' }
    }

    // Determine file filters based on asset type
    let filters = []
    if (assetType === 'image') {
      filters = [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }]
    } else if (assetType === 'video') {
      filters = [{ name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'] }]
    } else {
      filters = [
        { name: 'Media Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'] }
      ]
    }

    // Show file picker
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Assets',
      filters,
      properties: ['openFile', 'multiSelections']
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    // Get current year-month for organization
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const targetDir = path.join(libPath, 'assets', 'media', yearMonth)

    // Create target directory if it doesn't exist
    fs.mkdirSync(targetDir, { recursive: true })

    // Import each file
    const importedAssets = []
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']

    for (const sourcePath of filePaths) {
      const filename = path.basename(sourcePath)
      const targetPath = path.join(targetDir, filename)

      // Copy file to library
      fs.copyFileSync(sourcePath, targetPath)

      // Determine asset type
      const ext = filename.split('.').pop().toLowerCase()
      let type = 'unknown'
      if (imageExtensions.includes(ext)) {
        type = 'image'
      } else if (videoExtensions.includes(ext)) {
        type = 'video'
      }

      // Create asset URL
      const assetUrl = `assets://media/${yearMonth}/${filename}`

      importedAssets.push({
        filename,
        path: targetPath,
        url: assetUrl,
        type
      })
    }

    return { success: true, assets: importedAssets }
  } catch (error) {
    console.error('Import assets failed:', error)
    return { success: false, error: error.message }
  }
})

// Check which events use a specific asset
ipcMain.handle('check-asset-usage', async (event, libPath, assetUrl) => {
  try {
    if (!libPath || !assetUrl) {
      return []
    }

    const eventsDir = path.join(libPath, 'events')
    if (!fs.existsSync(eventsDir)) {
      return []
    }

    const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'))
    const usageList = []

    // Search each event file for the asset URL
    for (const eventFile of eventFiles) {
      const eventPath = path.join(eventsDir, eventFile)
      try {
        const content = fs.readFileSync(eventPath, 'utf-8')

        // Simple string search - if the asset URL appears anywhere in the file, it's in use
        if (content.includes(assetUrl)) {
          // Get the event name (remove .json extension)
          const eventName = eventFile.replace('.json', '')
          usageList.push(eventName)
        }
      } catch (error) {
        console.error(`Error reading event file ${eventFile}:`, error)
      }
    }

    return usageList
  } catch (error) {
    console.error('Check asset usage failed:', error)
    return []
  }
})

// Delete an asset file from the library
ipcMain.handle('delete-library-asset', async (event, libPath, assetPath) => {
  try {
    if (!libPath || !assetPath) {
      return { success: false, error: 'Invalid parameters' }
    }

    // Verify the asset path is within the library
    if (!assetPath.startsWith(libPath)) {
      return { success: false, error: 'Asset path is not within library' }
    }

    // Verify file exists
    if (!fs.existsSync(assetPath)) {
      return { success: false, error: 'Asset file not found' }
    }

    // Delete the file
    fs.unlinkSync(assetPath)
    console.log('Asset deleted:', assetPath)

    return { success: true }
  } catch (error) {
    console.error('Delete asset failed:', error)
    return { success: false, error: error.message }
  }
})

// Remote control IPC handlers
ipcMain.handle('broadcast-presentation-state', async (event, state) => {
  // Broadcast state to all connected remote clients
  broadcastStateUpdate(state)
  return { success: true }
})

// Helper to send logs to renderer
function sendLogToRenderer(message) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('main-process-log', message)
  }
}

// Set app name (in dev, it defaults to "Electron")
app.setName('DCProjector')

// App lifecycle
app.whenReady().then(() => {
  setupApplicationMenu()

  // Register custom protocol for loading local images and videos
  protocol.registerFileProtocol('local-image', (request, callback) => {
    const logMsg = `local-image protocol request: ${request.url}`
    console.log(logMsg)
    sendLogToRenderer(logMsg)
    
    // Parse the URL properly to handle Windows paths
    let filePath = decodeURIComponent(request.url.replace('local-image://', ''))
    sendLogToRenderer(`After removing protocol: ${filePath}`)
    
    // On Windows, the path might start with a slash before the drive letter
    // e.g., "/C:/Users/..." should become "C:/Users/..."
    if (process.platform === 'win32' && filePath.match(/^\/[A-Za-z]:/)) {
      filePath = filePath.substring(1)
      sendLogToRenderer(`After removing leading slash: ${filePath}`)
    }
    
    // Convert forward slashes to backslashes on Windows for fs operations
    if (process.platform === 'win32') {
      // Simply replace forward slashes with backslashes
      // The colon should already be there from the original URL
      filePath = filePath.replace(/\//g, '\\')
      sendLogToRenderer(`After converting slashes: ${filePath}`)
      
      // Debug: Let's check if the colon is missing
      if (!filePath.match(/^[A-Za-z]:\\/)) {
        sendLogToRenderer(`WARNING: Path missing colon after drive letter: ${filePath}`)
        // Try to fix it if it's missing
        filePath = filePath.replace(/^([A-Za-z])\\/, '$1:\\')
        sendLogToRenderer(`Fixed path: ${filePath}`)
      }
    }

    try {
      // Verify file exists before returning
      sendLogToRenderer(`Checking if file exists: ${filePath}`)
      if (fs.existsSync(filePath)) {
        sendLogToRenderer(`File exists! Returning path: ${filePath}`)
        // Get file stats for caching headers
        const stats = fs.statSync(filePath)

        // Determine MIME type from extension
        const ext = path.extname(filePath).toLowerCase()
        const mimeTypes = {
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.ogg': 'video/ogg',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        }

        const mimeType = mimeTypes[ext]

        if (mimeType) {
          callback({
            path: filePath,
            headers: {
              'Content-Type': mimeType,
              'Accept-Ranges': 'bytes',
              // Enable aggressive browser caching - cache for 1 year
              'Cache-Control': 'public, max-age=31536000, immutable',
              // Use file modification time as ETag for cache validation
              'ETag': `"${stats.mtime.getTime()}-${stats.size}"`,
              'Last-Modified': stats.mtime.toUTCString()
            }
          })
        } else {
          // For Windows, we need to ensure the path is properly formatted
          // Just return the path - Electron will handle the file serving
          console.log('Returning path to callback:', filePath)
          callback({ path: filePath })
        }
      } else {
        console.error('Asset file not found:', filePath)
        // Try with original path format as fallback
        const originalPath = decodeURIComponent(request.url.replace('local-image://', ''))
        console.log('Trying original path:', originalPath)
        if (fs.existsSync(originalPath)) {
          console.log('Original path exists!')
          callback({ path: originalPath })
        } else {
          callback({ error: -6 }) // FILE_NOT_FOUND
        }
      }
    } catch (error) {
      console.error('Error loading asset:', filePath, error)
      callback({ error: -2 }) // FAILED
    }
  })

  createMainWindow()

  // Start remote control server
  setupRemoteServer(3777)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeRemoteServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeRemoteServer()
})
