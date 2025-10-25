const { app, BrowserWindow } = require('electron')

// Disable sandbox FIRST - before anything else
app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('--disable-setuid-sandbox')

console.log('Electron version:', process.versions.electron)
console.log('Chrome version:', process.versions.chrome)

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: true
    }
  })

  win.loadURL('data:text/html,<h1>Bare Electron Test</h1><p>Try opening DevTools with F12 or Ctrl+Shift+I</p>')

  // Auto-open DevTools
  win.webContents.openDevTools()

  console.log('Window created, DevTools should be open')
}

app.whenReady().then(() => {
  console.log('App ready, creating window...')
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
