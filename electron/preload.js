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
  },

  // Video completion (from projector to control)
  notifyVideoEnded: () => ipcRenderer.send('video-ended'),
  onVideoEnded: (callback) => {
    ipcRenderer.on('video-ended-notification', callback)
  },

  // File operations
  savePresentation: (data) => ipcRenderer.invoke('save-presentation', data),
  loadPresentation: () => ipcRenderer.invoke('load-presentation'),
  selectImages: () => ipcRenderer.invoke('select-images'),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Library management
  createLibrary: (parentPath, libraryName) => ipcRenderer.invoke('create-library', parentPath, libraryName),
  loadLibraryMetadata: (libPath) => ipcRenderer.invoke('load-library-metadata', libPath),
  saveLibraryMetadata: (libPath, metadata) => ipcRenderer.invoke('save-library-metadata', libPath, metadata),
  listLibraryEvents: (libPath) => ipcRenderer.invoke('list-library-events', libPath),
  createLibraryEvent: (libPath, eventName) => ipcRenderer.invoke('create-library-event', libPath, eventName),
  loadLibraryEvent: (libPath, eventName) => ipcRenderer.invoke('load-library-event', libPath, eventName),
  saveLibraryEvent: (eventPath, data) => ipcRenderer.invoke('save-library-event', eventPath, data),
  deleteLibraryEvent: (libPath, eventName) => ipcRenderer.invoke('delete-library-event', libPath, eventName),
  resolveAssetPath: (libPath, assetUrl) => ipcRenderer.invoke('resolve-asset-path', libPath, assetUrl),
  selectLibraryFolder: () => ipcRenderer.invoke('select-library-folder'),

  // Asset management
  listLibraryAssets: (libPath) => ipcRenderer.invoke('list-library-assets', libPath),
  importAssetsToLibrary: (libPath, assetType) => ipcRenderer.invoke('import-assets-to-library', libPath, assetType)
})
