const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const path = require('path')

let io = null
let httpServer = null
let presentationState = null

function setupRemoteServer(port = 3777) {
  console.log('Setting up remote control server on port', port)

  const app = express()
  httpServer = createServer(app)
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Serve static files for remote control interface
  app.use('/remote', express.static(path.join(__dirname, '../public/remote')))

  // Simple status endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      online: true,
      connectedClients: io.engine.clientsCount,
      state: presentationState
    })
  })

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Remote client connected:', socket.id)

    // Send current state immediately
    if (presentationState) {
      socket.emit('state-update', presentationState)
    }

    // Remote control commands
    socket.on('stage-next', () => {
      console.log('Remote: stage-next')
      notifyMainWindow('remote-stage-next')
    })

    socket.on('stage-prev', () => {
      console.log('Remote: stage-prev')
      notifyMainWindow('remote-stage-prev')
    })

    socket.on('go-live', () => {
      console.log('Remote: go-live')
      notifyMainWindow('remote-go-live')
    })

    socket.on('clear', () => {
      console.log('Remote: clear')
      notifyMainWindow('remote-clear')
    })

    socket.on('stage-slide', (data) => {
      console.log('Remote: stage-slide', data)
      notifyMainWindow('remote-stage-slide', data)
    })

    socket.on('next-stack', () => {
      console.log('Remote: next-stack')
      notifyMainWindow('remote-next-stack')
    })

    socket.on('prev-stack', () => {
      console.log('Remote: prev-stack')
      notifyMainWindow('remote-prev-stack')
    })

    socket.on('disconnect', () => {
      console.log('Remote client disconnected:', socket.id)
    })
  })

  httpServer.listen(port, () => {
    console.log(`✅ Remote control server listening on http://localhost:${port}`)
    console.log(`   Remote interface: http://localhost:${port}/remote`)
  })

  return { io, httpServer, app }
}

function broadcastStateUpdate(state) {
  presentationState = state
  if (io) {
    io.emit('state-update', state)
  }
}

function notifyMainWindow(event, data = null) {
  // This will be set up by main.js
  if (typeof global.sendToMainWindow === 'function') {
    global.sendToMainWindow(event, data)
  }
}

function closeRemoteServer() {
  if (httpServer) {
    httpServer.close(() => {
      console.log('Remote control server closed')
    })
  }
  if (io) {
    io.close()
  }
}

module.exports = {
  setupRemoteServer,
  broadcastStateUpdate,
  closeRemoteServer
}
