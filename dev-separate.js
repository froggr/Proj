const { spawn } = require('child_process')
const path = require('path')

console.log('Starting Vite dev server...')

// Set env to prevent vite-plugin-electron from auto-starting
process.env.ELECTRON_SEPARATE = 'true'

// Start Vite in the background
const vite = spawn('npx', ['vite'], {
  stdio: 'pipe',
  shell: true,
  env: {
    ...process.env,
    ELECTRON_SEPARATE: 'true'
  }
})

let viteReady = false
let vitePort = null

// Parse Vite output to find when it's ready
vite.stdout.on('data', (data) => {
  const output = data.toString()
  console.log('[Vite]', output.trim())

  // Look for the local URL
  const portMatch = output.match(/Local:.*:(\d+)/)
  if (portMatch && !viteReady) {
    vitePort = portMatch[1]
    viteReady = true
    console.log(`\nVite ready on port ${vitePort}, starting Electron...`)

    // Set environment variable for Electron
    process.env.VITE_DEV_SERVER_URL = `http://localhost:${vitePort}`

    // Start Electron with all necessary flags
    const electron = spawn('npx', [
      'electron',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      'electron/main.js'
    ], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_DEV_SERVER_URL: `http://localhost:${vitePort}`
      }
    })

    electron.on('close', () => {
      console.log('Electron closed, stopping Vite...')
      vite.kill()
      process.exit()
    })
  }
})

vite.stderr.on('data', (data) => {
  console.error('[Vite Error]', data.toString())
})

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nStopping dev server...')
  vite.kill()
  process.exit()
})