const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Monitor management
  getAvailableMonitors: () => ipcRenderer.invoke('get-available-monitors'),
  openProjectorWindow: (monitorIndex) => ipcRenderer.invoke('open-projector-window', monitorIndex),
  closeProjectorWindow: () => ipcRenderer.invoke('close-projector-window'),

  // Projector updates
  updateProjector: (slideData) => ipcRenderer.invoke('update-projector', slideData),

  // Projector window listener
  onUpdateSlide: (callback) => {
    ipcRenderer.on('update-slide', (event, slideData) => callback(slideData))
  },

  removeUpdateSlideListener: () => {
    ipcRenderer.removeAllListeners('update-slide')
  }
})
