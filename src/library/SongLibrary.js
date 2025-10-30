// Song Library Management
// Stores songs in the current library's songs.json file
// Integrates with the existing library system (useLibrary composable)

import { ref, computed } from 'vue'
import { parseChordPro } from '@/parsers/ChordProParser'
import { parseOnSong } from '@/parsers/OnSongParser'
import { useLibrary } from '@/composables/useLibrary'

const songs = ref([])
const isLoaded = ref(false)

/**
 * Load songs from the current library
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function loadSongs(libraryRoot) {
  if (!libraryRoot || !window.electronAPI?.loadSongs) {
    console.warn('loadSongs: Missing libraryRoot or electronAPI')
    return
  }

  try {
    console.log('loadSongs: Loading from', libraryRoot)
    const result = await window.electronAPI.loadSongs(libraryRoot)
    console.log('loadSongs: Result:', result)

    if (result.success) {
      songs.value = result.data
      isLoaded.value = true
      console.log('loadSongs: Loaded', songs.value.length, 'songs')
    } else {
      songs.value = []
      isLoaded.value = true
      console.log('loadSongs: Failed to load songs:', result.error)
    }
  } catch (error) {
    songs.value = []
    isLoaded.value = true
    console.error('loadSongs: Error:', error)
  }
}

/**
 * Save songs to the current library
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function saveSongs(libraryRoot) {
  if (!libraryRoot || !window.electronAPI?.saveSongs) {
    console.error('saveSongs: Missing libraryRoot or electronAPI', { libraryRoot, hasAPI: !!window.electronAPI?.saveSongs })
    return
  }

  try {
    console.log('saveSongs: Saving', songs.value.length, 'songs to', libraryRoot)

    // Strip out Vue reactivity by serializing to plain JSON
    const plainSongs = JSON.parse(JSON.stringify(songs.value))

    const result = await window.electronAPI.saveSongs(libraryRoot, plainSongs)
    console.log('saveSongs: Save result:', result)

    if (!result.success) {
      throw new Error(result.error)
    }
    console.log('saveSongs: Successfully saved', plainSongs.length, 'songs')
  } catch (error) {
    console.error('saveSongs: Error:', error)
    throw error
  }
}

/**
 * Add a song to the library
 * @param {Object} song - Song object to add
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function addSong(song, libraryRoot) {
  if (!libraryRoot) {
    console.error('addSong: No library open')
    throw new Error('No library open')
  }

  // Ensure unique ID
  song.id = song.id || Date.now().toString()

  // Remove any existing song with same ID
  const existingIndex = songs.value.findIndex(s => s.id === song.id)
  if (existingIndex !== -1) {
    console.log('addSong: Replacing existing song with ID', song.id)
    songs.value.splice(existingIndex, 1)
  }

  console.log('addSong: Adding song', song.title, 'to library')
  songs.value.push(song)
  console.log('addSong: Total songs now:', songs.value.length)
  await saveSongs(libraryRoot)
  console.log('addSong: Songs saved to disk')
  return song
}

/**
 * Update an existing song
 * @param {string} songId - ID of song to update
 * @param {Object} updates - Properties to update
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function updateSong(songId, updates, libraryRoot) {
  if (!libraryRoot) {
    throw new Error('No library open')
  }

  const index = songs.value.findIndex(s => s.id === songId)
  if (index !== -1) {
    songs.value[index] = { ...songs.value[index], ...updates }
    await saveSongs(libraryRoot)
    return songs.value[index]
  }
  return null
}

/**
 * Delete a song from the library
 * @param {string} songId - ID of song to delete
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function deleteSong(songId, libraryRoot) {
  if (!libraryRoot) {
    throw new Error('No library open')
  }

  const index = songs.value.findIndex(s => s.id === songId)
  if (index !== -1) {
    const deleted = songs.value.splice(index, 1)[0]
    await saveSongs(libraryRoot)
    return deleted
  }
  return null
}

/**
 * Find a song by ID
 */
export function findSongById(songId) {
  return songs.value.find(s => s.id === songId)
}

/**
 * Search songs by title or artist
 */
export function searchSongs(query) {
  const lowerQuery = query.toLowerCase()
  return songs.value.filter(song =>
    song.title?.toLowerCase().includes(lowerQuery) ||
    song.artist?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Browse for song files to import
 */
export async function browseSongFiles() {
  if (!window.electronAPI?.browseForSongFiles) {
    throw new Error('Electron API not available')
  }

  const result = await window.electronAPI.browseForSongFiles()
  return result
}

/**
 * Import a ChordPro file
 * @param {string} filePath - Full path to the file
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function importChordProFile(filePath, libraryRoot) {
  if (!libraryRoot) {
    throw new Error('No library open')
  }

  try {
    if (!window.electronAPI?.readSongFile) {
      throw new Error('Electron API not available')
    }

    const result = await window.electronAPI.readSongFile(filePath)

    if (!result.success) {
      throw new Error(result.error)
    }

    const fileName = result.filename.replace(/\.(txt|pro|chordpro)$/i, '')
    const song = parseChordPro(result.content, fileName)

    // Validate parsed song has required fields
    if (!song.processed_sections || song.processed_sections.length === 0) {
      throw new Error('Failed to parse song sections')
    }

    await addSong(song, libraryRoot)
    return { success: true, song }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Import an OnSong file
 * @param {string} filePath - Full path to the file
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function importOnSongFile(filePath, libraryRoot) {
  if (!libraryRoot) {
    throw new Error('No library open')
  }

  try {
    if (!window.electronAPI?.readSongFile) {
      throw new Error('Electron API not available')
    }

    const result = await window.electronAPI.readSongFile(filePath)

    if (!result.success) {
      throw new Error(result.error)
    }

    const fileName = result.filename.replace(/\.onsong$/i, '')
    const song = parseOnSong(result.content, fileName)

    // Validate parsed song has required fields
    if (!song.processed_sections || song.processed_sections.length === 0) {
      throw new Error('Failed to parse song sections')
    }

    await addSong(song, libraryRoot)
    return { success: true, song }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Import multiple song files at once
 * @param {string[]} filePaths - Array of file paths to import
 * @param {string} libraryRoot - Path to .dclib folder
 */
export async function importSongFiles(filePaths, libraryRoot) {
  const results = {
    succeeded: [],
    failed: []
  }

  for (const filePath of filePaths) {
    const ext = filePath.split('.').pop().toLowerCase()

    try {
      let result
      if (ext === 'onsong') {
        result = await importOnSongFile(filePath, libraryRoot)
      } else {
        // Default to ChordPro parser for .txt, .pro, .chordpro
        result = await importChordProFile(filePath, libraryRoot)
      }

      if (result.success) {
        results.succeeded.push({ filePath, song: result.song })
      } else {
        results.failed.push({ filePath, error: result.error })
      }
    } catch (error) {
      results.failed.push({ filePath, error: error.message })
    }
  }

  return results
}

/**
 * Composable to manage song library
 * Integrates with the existing library system
 */
export function useSongLibrary() {
  const { libraryRoot, isLibraryOpen } = useLibrary()

  // Computed property - songs only available when library is open
  const areSongsAvailable = computed(() => isLibraryOpen.value && isLoaded.value)

  return {
    songs,
    isLoaded,
    areSongsAvailable,
    loadSongs: () => loadSongs(libraryRoot.value),
    saveSongs: () => saveSongs(libraryRoot.value),
    addSong: (song) => addSong(song, libraryRoot.value),
    updateSong: (songId, updates) => updateSong(songId, updates, libraryRoot.value),
    deleteSong: (songId) => deleteSong(songId, libraryRoot.value),
    findSongById,
    searchSongs,
    browseSongFiles,
    importChordProFile: (filePath) => importChordProFile(filePath, libraryRoot.value),
    importOnSongFile: (filePath) => importOnSongFile(filePath, libraryRoot.value),
    importSongFiles: (filePaths) => importSongFiles(filePaths, libraryRoot.value)
  }
}
