"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // Monitor management
  getAvailableMonitors: () => ipcRenderer.invoke("get-available-monitors"),
  openProjectorWindow: (monitorIndex) => ipcRenderer.invoke("open-projector-window", monitorIndex),
  closeProjectorWindow: () => ipcRenderer.invoke("close-projector-window"),
  // Projector updates
  updateProjector: (slideData) => ipcRenderer.invoke("update-projector", slideData),
  // Projector window listener
  onUpdateSlide: (callback) => {
    ipcRenderer.on("update-slide", (event, slideData) => callback(slideData));
  },
  removeUpdateSlideListener: () => {
    ipcRenderer.removeAllListeners("update-slide");
  },
  // Video completion (from projector to control)
  notifyVideoEnded: () => ipcRenderer.send("video-ended"),
  onVideoEnded: (callback) => {
    ipcRenderer.on("video-ended-notification", callback);
  },
  // File operations
  savePresentation: (data) => ipcRenderer.invoke("save-presentation", data),
  loadPresentation: () => ipcRenderer.invoke("load-presentation"),
  selectImages: () => ipcRenderer.invoke("select-images"),
  // Window controls
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close")
});
