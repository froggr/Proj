import { ref } from 'vue'

const isProjectorOpen = ref(false)

export function useProjector() {
  async function getAvailableMonitors() {
    try {
      return await window.electronAPI.getAvailableMonitors()
    } catch (error) {
      console.error('Failed to get monitors:', error)
      return []
    }
  }

  async function openProjector(monitorIndex = null) {
    try {
      const result = await window.electronAPI.openProjectorWindow(monitorIndex)
      if (result.success) {
        isProjectorOpen.value = true
      }
    } catch (error) {
      console.error('Failed to open projector window:', error)
    }
  }

  async function closeProjector() {
    try {
      await window.electronAPI.closeProjectorWindow()
      isProjectorOpen.value = false
    } catch (error) {
      console.error('Failed to close projector window:', error)
    }
  }

  return {
    isProjectorOpen,
    getAvailableMonitors,
    openProjector,
    closeProjector
  }
}
