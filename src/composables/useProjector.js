import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'

const isProjectorOpen = ref(false)

export function useProjector() {
  async function getAvailableMonitors() {
    try {
      return await invoke('get_available_monitors')
    } catch (error) {
      console.error('Failed to get monitors:', error)
      return []
    }
  }

  async function openProjector(monitorIndex = null) {
    try {
      await invoke('open_projector_window', { monitorIndex })
      isProjectorOpen.value = true
    } catch (error) {
      console.error('Failed to open projector window:', error)
    }
  }

  async function closeProjector() {
    try {
      await invoke('close_projector_window')
      isProjectorOpen.value = false
    } catch (error) {
      console.error('Failed to close projector window:', error)
    }
  }

  async function updateProjectorSlide(slideData) {
    try {
      await emit('update-slide', slideData)
    } catch (error) {
      console.error('Failed to update projector:', error)
    }
  }

  async function listenToSlideUpdates(callback) {
    try {
      await listen('update-slide', (event) => {
        callback(event.payload)
      })
    } catch (error) {
      console.error('Failed to listen to slide updates:', error)
    }
  }

  return {
    isProjectorOpen,
    getAvailableMonitors,
    openProjector,
    closeProjector,
    updateProjectorSlide,
    listenToSlideUpdates
  }
}
