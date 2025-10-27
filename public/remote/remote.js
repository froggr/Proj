// Socket.IO connection
const socket = io()

// UI Elements
const statusDot = document.getElementById('statusDot')
const statusText = document.getElementById('statusText')
const stagedContent = document.getElementById('stagedContent')
const liveContent = document.getElementById('liveContent')
const btnGoLive = document.getElementById('btnGoLive')
const btnClear = document.getElementById('btnClear')
const btnStagePrev = document.getElementById('btnStagePrev')
const btnStageNext = document.getElementById('btnStageNext')
const btnStackPrev = document.getElementById('btnStackPrev')
const btnStackNext = document.getElementById('btnStackNext')

// Connection status
socket.on('connect', () => {
  console.log('Connected to server')
  statusDot.className = 'status-dot connected'
  statusText.textContent = 'Connected'
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
  statusDot.className = 'status-dot disconnected'
  statusText.textContent = 'Disconnected'
})

// State updates
socket.on('state-update', (state) => {
  console.log('State update:', state)
  updateStateDisplay(state)
})

// Update state display
function updateStateDisplay(state) {
  if (!state) return

  // Update staged state
  if (state.staged) {
    const stackTitle = state.staged.stackTitle || 'No stack'
    const slideTitle = state.staged.slideTitle || 'No slide'
    stagedContent.innerHTML = `
      <div class="state-stack">${stackTitle}</div>
      <div class="state-slide">${slideTitle}</div>
    `
  }

  // Update live state
  if (state.live) {
    if (state.live.stackIndex !== null && state.live.slideIndex !== null) {
      const stackTitle = state.live.stackTitle || 'Unknown stack'
      const slideTitle = state.live.slideTitle || 'Unknown slide'
      liveContent.innerHTML = `
        <div class="state-stack">${stackTitle}</div>
        <div class="state-slide">${slideTitle}</div>
      `
    } else {
      liveContent.innerHTML = `
        <div class="state-stack">—</div>
        <div class="state-slide">Cleared</div>
      `
    }
  }
}

// Button handlers with haptic feedback
function handleButton(callback) {
  // Haptic feedback for mobile
  if (navigator.vibrate) {
    navigator.vibrate(10)
  }
  callback()
}

btnGoLive.addEventListener('click', () => {
  handleButton(() => {
    console.log('Go Live clicked')
    socket.emit('go-live')
  })
})

btnClear.addEventListener('click', () => {
  handleButton(() => {
    console.log('Clear clicked')
    socket.emit('clear')
  })
})

btnStagePrev.addEventListener('click', () => {
  handleButton(() => {
    console.log('Stage Prev clicked')
    socket.emit('stage-prev')
  })
})

btnStageNext.addEventListener('click', () => {
  handleButton(() => {
    console.log('Stage Next clicked')
    socket.emit('stage-next')
  })
})

btnStackPrev.addEventListener('click', () => {
  handleButton(() => {
    console.log('Stack Prev clicked')
    socket.emit('prev-stack')
  })
})

btnStackNext.addEventListener('click', () => {
  handleButton(() => {
    console.log('Stack Next clicked')
    socket.emit('next-stack')
  })
})

// Keyboard shortcuts (for desktop browsers)
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault()
      socket.emit('go-live')
      break
    case 'Escape':
      e.preventDefault()
      socket.emit('clear')
      break
    case 'ArrowLeft':
      e.preventDefault()
      socket.emit('stage-prev')
      break
    case 'ArrowRight':
      e.preventDefault()
      socket.emit('stage-next')
      break
    case 'ArrowUp':
      e.preventDefault()
      socket.emit('prev-stack')
      break
    case 'ArrowDown':
      e.preventDefault()
      socket.emit('next-stack')
      break
  }
})

// Prevent zoom on double-tap for iOS
let lastTouchEnd = 0
document.addEventListener('touchend', (event) => {
  const now = Date.now()
  if (now - lastTouchEnd <= 300) {
    event.preventDefault()
  }
  lastTouchEnd = now
}, false)

console.log('DCProjector Remote initialized')
