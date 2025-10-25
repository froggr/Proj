const { app, BrowserWindow, ipcMain, screen, dialog, Menu, protocol } = require('electron')
const path = require('path')
const fs = require('fs')

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
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'DongleControl Projector'
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
    // Auto-open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window finished loading')
    if (isDev) {
      console.log('Attempting to open DevTools...')

      // Try opening DevTools multiple times with different approaches
      setTimeout(() => {
        console.log('Trying to open DevTools (attempt 1)...')
        mainWindow.webContents.openDevTools()
      }, 100)

      setTimeout(() => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
          console.log('Trying to open DevTools (attempt 2 - detached)...')
          mainWindow.webContents.openDevTools({ mode: 'detach' })
        }
      }, 500)

      setTimeout(() => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
          console.log('Trying to open DevTools (attempt 3 - undocked)...')
          mainWindow.webContents.openDevTools({ mode: 'undocked' })
        }
      }, 1000)
    }
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createProjectorWindow(monitorIndex = null) {
  const displays = screen.getAllDisplays()
  console.log('Available displays:', displays.length)
  displays.forEach((d, i) => {
    console.log(`  Display ${i}: ${d.bounds.width}x${d.bounds.height} at (${d.bounds.x}, ${d.bounds.y})`)
  })

  let targetDisplay = displays[0] // Default to primary
  if (monitorIndex !== null && displays[monitorIndex]) {
    targetDisplay = displays[monitorIndex]
    console.log(`Selected display ${monitorIndex}`)
  }

  const { x, y, width, height } = targetDisplay.bounds
  console.log(`Opening projector on display at (${x}, ${y}) with size ${width}x${height}`)

  projectorWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    fullscreen: false,  // Explicitly disable fullscreen mode
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'DongleControl Projector - Projector'
  })

  // Maximize instead of fullscreen to respect the display bounds
  projectorWindow.maximize()

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

// App lifecycle
app.whenReady().then(() => {
  // Register custom protocol for loading local images
  protocol.registerFileProtocol('local-image', (request, callback) => {
    // Remove 'local-image://' prefix and decode URI
    const filePath = decodeURIComponent(request.url.replace('local-image://', ''))
    console.log('Loading local image:', filePath)

    try {
      // Verify file exists before returning
      if (fs.existsSync(filePath)) {
        callback({ path: filePath })
      } else {
        console.error('Image file not found:', filePath)
        callback({ error: -6 }) // FILE_NOT_FOUND
      }
    } catch (error) {
      console.error('Error loading image:', error)
      callback({ error: -2 }) // FAILED
    }
  })

  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
