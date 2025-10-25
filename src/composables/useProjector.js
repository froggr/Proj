import { ref } from 'vue'

const isProjectorOpen = ref(false)

export function useProjector() {
  async function getAvailableMonitors() {
    try {
      console.log('useProjector: getAvailableMonitors called')
      console.log('window.electronAPI:', window.electronAPI)
      if (!window.electronAPI) {
        console.error('window.electronAPI is not available!')
        return []
      }
      const monitors = await window.electronAPI.getAvailableMonitors()
      console.log('useProjector: Got monitors:', monitors)
      return monitors
    } catch (error) {
      console.error('useProjector: Failed to get monitors:', error)
      return []
    }
  }

  async function openProjector(monitorIndex = null) {
    try {
      console.log('useProjector: openProjector called with monitorIndex:', monitorIndex)
      if (!window.electronAPI) {
        console.error('window.electronAPI is not available!')
        return
      }
      const result = await window.electronAPI.openProjectorWindow(monitorIndex)
      console.log('useProjector: openProjectorWindow result:', result)
      if (result.success) {
        isProjectorOpen.value = true
      }
    } catch (error) {
      console.error('useProjector: Failed to open projector window:', error)
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
