import { ref, computed } from 'vue'

const libraryRoot = ref(null) // Path to .dclib folder
const libraryMetadata = ref(null) // Contents of library.json
const currentEventPath = ref(null) // Path to currently open event JSON
const currentEventName = ref(null) // Name of current event

const LAST_LIBRARY_KEY = 'dc_lastLibraryPath'

export function useLibrary() {
  const isLibraryOpen = computed(() => libraryRoot.value !== null)

  /**
   * Create a new library
   * @param {string} parentPath - Where to create the library
   * @param {string} libraryName - Name of the library
   * @returns {Promise<{success: boolean, path?: string, error?: string}>}
   */
  async function createLibrary(parentPath, libraryName) {
    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API not available' }
      }

      const libraryPath = await window.electronAPI.createLibrary(parentPath, libraryName)

      if (libraryPath) {
        libraryRoot.value = libraryPath
        libraryMetadata.value = {
          name: libraryName,
          created: new Date().toISOString(),
          version: '1.0',
          lastOpened: new Date().toISOString()
        }

        // Save to electron-store for auto-open on next launch
        try {
          if (window.electronAPI?.settingsSet) {
            await window.electronAPI.settingsSet('lastLibraryPath', libraryPath)
          }
        } catch (e) {
          console.warn('Failed to save library path:', e)
        }

        return { success: true, path: libraryPath }
      }

      return { success: false, error: 'Failed to create library' }
    } catch (error) {
      console.error('Create library error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Open an existing library
   * @param {string} libPath - Path to .dclib folder
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function openLibrary(libPath) {
    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API not available' }
      }

      const metadata = await window.electronAPI.loadLibraryMetadata(libPath)

      if (metadata) {
        libraryRoot.value = libPath
        libraryMetadata.value = metadata

        // Update last opened time
        metadata.lastOpened = new Date().toISOString()
        await window.electronAPI.saveLibraryMetadata(libPath, metadata)

        // Save to electron-store for auto-open on next launch
        try {
          if (window.electronAPI?.settingsSet) {
            await window.electronAPI.settingsSet('lastLibraryPath', libPath)
          }
        } catch (e) {
          console.warn('Failed to save library path:', e)
        }

        return { success: true }
      }

      return { success: false, error: 'Invalid library' }
    } catch (error) {
      console.error('Open library error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Close the current library
   */
  async function closeLibrary() {
    libraryRoot.value = null
    libraryMetadata.value = null
    currentEventPath.value = null
    currentEventName.value = null

    // Clear from electron-store
    try {
      if (window.electronAPI?.settingsDelete) {
        await window.electronAPI.settingsDelete('lastLibraryPath')
      }
    } catch (e) {
      console.warn('Failed to clear library path:', e)
    }
  }

  /**
   * Get list of events in the library
   * @returns {Promise<string[]>} Array of event names
   */
  async function getEventsList() {
    if (!isLibraryOpen.value) return []

    try {
      const events = await window.electronAPI.listLibraryEvents(libraryRoot.value)
      return events || []
    } catch (error) {
      console.error('Get events list error:', error)
      return []
    }
  }

  /**
   * Create a new event in the library
   * @param {string} eventName - Name of the event
   * @returns {Promise<{success: boolean, path?: string, error?: string}>}
   */
  async function createEvent(eventName) {
    if (!isLibraryOpen.value) {
      return { success: false, error: 'No library open' }
    }

    try {
      const eventPath = await window.electronAPI.createLibraryEvent(
        libraryRoot.value,
        eventName
      )

      if (eventPath) {
        currentEventPath.value = eventPath
        currentEventName.value = eventName
        return { success: true, path: eventPath }
      }

      return { success: false, error: 'Failed to create event' }
    } catch (error) {
      console.error('Create event error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Load an event from the library
   * @param {string} eventName - Name of the event to load
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async function loadEvent(eventName) {
    if (!isLibraryOpen.value) {
      return { success: false, error: 'No library open' }
    }

    try {
      const result = await window.electronAPI.loadLibraryEvent(
        libraryRoot.value,
        eventName
      )

      if (result.success) {
        currentEventPath.value = result.path
        currentEventName.value = eventName
        return { success: true, data: result.data }
      }

      return { success: false, error: result.error }
    } catch (error) {
      console.error('Load event error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Save the current event
   * @param {object} presentationData - Presentation data to save
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function saveEvent(presentationData) {
    if (!isLibraryOpen.value || !currentEventPath.value) {
      return { success: false, error: 'No event open' }
    }

    try {
      const success = await window.electronAPI.saveLibraryEvent(
        currentEventPath.value,
        presentationData
      )

      return { success }
    } catch (error) {
      console.error('Save event error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Resolve an asset:// URL to a full file path
   * @param {string} assetUrl - Asset URL (e.g., "assets://media/2025-01/video.mp4")
   * @returns {Promise<string|null>} Full file path or null if not found
   */
  async function resolveAssetPath(assetUrl) {
    if (!isLibraryOpen.value || !assetUrl.startsWith('assets://')) {
      return assetUrl
    }

    try {
      const fullPath = await window.electronAPI.resolveAssetPath(
        libraryRoot.value,
        assetUrl
      )
      return fullPath
    } catch (error) {
      console.error('Resolve asset path error:', error)
      return null
    }
  }

  /**
   * Delete an event from the library
   * @param {string} eventName - Name of the event to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function deleteEvent(eventName) {
    if (!isLibraryOpen.value) {
      return { success: false, error: 'No library open' }
    }

    try {
      const success = await window.electronAPI.deleteLibraryEvent(
        libraryRoot.value,
        eventName
      )

      if (success) {
        // If we just deleted the currently open event, close it
        if (currentEventName.value === eventName) {
          currentEventPath.value = null
          currentEventName.value = null
        }
        return { success: true }
      }

      return { success: false, error: 'Failed to delete event' }
    } catch (error) {
      console.error('Delete event error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get the last opened library path from electron-store
   * @returns {Promise<string|null>} Library path or null if none saved
   */
  async function getLastLibraryPath() {
    try {
      if (window.electronAPI?.settingsGet) {
        return await window.electronAPI.settingsGet('lastLibraryPath')
      }
      return null
    } catch (e) {
      console.warn('Failed to get last library path:', e)
      return null
    }
  }

  return {
    // State
    libraryRoot,
    libraryMetadata,
    currentEventPath,
    currentEventName,
    isLibraryOpen,

    // Actions
    createLibrary,
    openLibrary,
    closeLibrary,
    getEventsList,
    createEvent,
    loadEvent,
    saveEvent,
    deleteEvent,
    resolveAssetPath,
    getLastLibraryPath
  }
}
