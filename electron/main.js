const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

// Keep references to windows to prevent garbage collection
let mainWindow = null
let projectorWindow = null

const isDev = process.env.NODE_ENV !== 'production'

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'DongleControl Projector'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173') // Vite dev server
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createProjectorWindow(monitorIndex = null) {
  const displays = screen.getAllDisplays()
  console.log('Available displays:', displays.length)

  let targetDisplay = displays[0] // Default to primary
  if (monitorIndex !== null && displays[monitorIndex]) {
    targetDisplay = displays[monitorIndex]
  }

  const { x, y, width, height } = targetDisplay.bounds

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
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'DongleControl Projector - Projector'
  })

  if (isDev) {
    projectorWindow.loadURL('http://localhost:5173/projector')
    // Don't open dev tools on projector in production
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
  return displays.map((display, index) =>
    `Monitor ${index + 1} - ${display.size.width}x${display.size.height}`
  )
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

// App lifecycle
app.whenReady().then(() => {
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
