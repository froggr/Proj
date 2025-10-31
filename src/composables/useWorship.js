// Worship State Management
// Manages worship mode state: setlist, songs, sections, staging, and live output

import { ref, computed } from 'vue'
import { useSongLibrary } from '@/library/SongLibrary'

// Current worship stack data (when a worship stack is active)
const activeWorshipStack = ref(null) // { id, setlist: [songIds], backgroundMode, backgroundVideos }
const currentSongIndex = ref(0) // Index in setlist
const stagedSectionIndex = ref(0) // Currently staged section
const liveSectionIndex = ref(null) // Currently live section (null = nothing live)
const lyricsCleared = ref(false) // True when lyrics are hidden but background is still showing

// Debug logging
import { watch } from 'vue'
watch(liveSectionIndex, (newVal, oldVal) => {
  console.log(`useWorship - liveSectionIndex changed: ${oldVal} -> ${newVal}`)
  console.trace('Stack trace:')
})

watch(stagedSectionIndex, (newVal, oldVal) => {
  console.log(`useWorship - stagedSectionIndex changed: ${oldVal} -> ${newVal}`)
})

watch(activeWorshipStack, (newVal) => {
  console.log('useWorship - activeWorshipStack changed:', newVal)
}, { deep: true })

// Background video state
const currentBackgroundVideo = ref(null) // Current video URL
const nextBackgroundVideo = ref(null) // Next video URL for crossfade

/**
 * Load a worship stack (called when clicking a worship song slide)
 * @param {Object} stackData - { currentSong, setlist, backgroundMode, backgroundVideos, linesPerSection }
 */
export function loadWorshipStack(stackData) {
  // Add intro/outro sections if they don't exist (for songs imported before this feature)
  if (stackData.currentSong?.processed_sections) {
    const sections = stackData.currentSong.processed_sections
    const linesPerSection = stackData.linesPerSection || 4

    // Split long sections into multiple parts
    const splitSections = []

    sections.forEach(section => {
      if (section.lines && section.lines.length > linesPerSection) {
        // Section is too long - split it into multiple parts
        const numParts = Math.ceil(section.lines.length / linesPerSection)
        for (let i = 0; i < numParts; i++) {
          const startLine = i * linesPerSection
          const endLine = Math.min(startLine + linesPerSection, section.lines.length)
          const partTitle = numParts > 1 ? `${section.title} (${i + 1}/${numParts})` : section.title

          splitSections.push({
            title: partTitle,
            lines: section.lines.slice(startLine, endLine),
            originalSection: section.title,
            part: i + 1,
            totalParts: numParts
          })
        }
      } else {
        // Section fits - keep as is
        splitSections.push(section)
      }
    })

    // Replace sections with split sections
    stackData.currentSong.processed_sections = splitSections

    // Check if Intro exists (first section)
    if (!splitSections[0] || splitSections[0].title !== 'Intro') {
      splitSections.unshift({ title: 'Intro', lines: [] })
    }

    // Check if Outro exists (last section)
    if (!splitSections[splitSections.length - 1] || splitSections[splitSections.length - 1].title !== 'Outro') {
      splitSections.push({ title: 'Outro', lines: [] })
    }
  }

  activeWorshipStack.value = stackData
  currentSongIndex.value = 0
  stagedSectionIndex.value = 0
  liveSectionIndex.value = null
  lyricsCleared.value = false

  // Note: We don't clear the projector here because the watcher in ControlView
  // will handle projection when the user goes live with a section

  // Load background video based on mode
  if (stackData.backgroundMode === 'single') {
    // Single video mode - use the backgroundVideo directly
    if (stackData.backgroundVideos?.length > 0) {
      currentBackgroundVideo.value = stackData.backgroundVideos[0]
    } else if (stackData.backgroundVideo) {
      // Support both backgroundVideo (single) and backgroundVideos (array)
      currentBackgroundVideo.value = stackData.backgroundVideo
    }
  } else if (stackData.backgroundMode === 'per-song') {
    loadBackgroundVideoForCurrentSong()
  } else if (stackData.backgroundMode === 'auto-rotate') {
    // Pick random video from rotation list
    if (stackData.backgroundVideos?.length > 0) {
      const randomIndex = Math.floor(Math.random() * stackData.backgroundVideos.length)
      currentBackgroundVideo.value = stackData.backgroundVideos[randomIndex]
    }
  }
}

/**
 * Exit worship mode (called when navigating away from worship stack)
 */
export function exitWorshipMode() {
  activeWorshipStack.value = null
  currentSongIndex.value = 0
  stagedSectionIndex.value = 0
  liveSectionIndex.value = null
  lyricsCleared.value = false
  currentBackgroundVideo.value = null
  nextBackgroundVideo.value = null
}

/**
 * Get the current song
 * @param {Function} findSongById - Function to find song by ID (pass from component)
 */
export function useCurrentSong(findSongById) {
  const currentSong = computed(() => {
    if (!activeWorshipStack.value?.currentSong) return null

    // If findSongById provided, use it to get full song data
    if (findSongById && activeWorshipStack.value.currentSong.id) {
      return findSongById(activeWorshipStack.value.currentSong.id)
    }

    // Otherwise return the song object directly
    return activeWorshipStack.value.currentSong
  })

  const stagedSection = computed(() => {
    if (!currentSong.value?.processed_sections) return null
    return currentSong.value.processed_sections[stagedSectionIndex.value]
  })

  const liveSection = computed(() => {
    if (!currentSong.value || liveSectionIndex.value === null) return null
    return currentSong.value.processed_sections?.[liveSectionIndex.value]
  })

  return {
    currentSong,
    stagedSection,
    liveSection
  }
}

/**
 * Navigate to a specific song in the setlist
 * @param {number} index - Song index in setlist
 */
export function goToSong(index) {
  if (!activeWorshipStack.value) return

  const setlist = activeWorshipStack.value.setlist
  if (index >= 0 && index < setlist.length) {
    currentSongIndex.value = index
    stagedSectionIndex.value = 0 // Reset to first section

    // Update background video if in per-song mode
    if (activeWorshipStack.value.backgroundMode === 'per-song') {
      loadBackgroundVideoForCurrentSong()
    } else if (activeWorshipStack.value.backgroundMode === 'auto-rotate') {
      // Rotate to next video
      rotateBackgroundVideo()
    }
  }
}

/**
 * Navigate to next song in setlist
 */
export function nextSong() {
  if (!activeWorshipStack.value) return

  const setlist = activeWorshipStack.value.setlist
  if (currentSongIndex.value < setlist.length - 1) {
    goToSong(currentSongIndex.value + 1)
  }
}

/**
 * Navigate to previous song in setlist
 */
export function prevSong() {
  if (!activeWorshipStack.value) return

  if (currentSongIndex.value > 0) {
    goToSong(currentSongIndex.value - 1)
  }
}

/**
 * Navigate to a specific section in the current song
 * @param {number} index - Section index
 */
export function stageSection(index) {
  if (!activeWorshipStack.value?.currentSong?.processed_sections) return

  const sections = activeWorshipStack.value.currentSong.processed_sections
  if (index >= 0 && index < sections.length) {
    stagedSectionIndex.value = index
  }
}

/**
 * Navigate to next section
 */
export function nextSection() {
  if (!activeWorshipStack.value?.currentSong?.processed_sections) return

  const sections = activeWorshipStack.value.currentSong.processed_sections
  if (stagedSectionIndex.value < sections.length - 1) {
    stagedSectionIndex.value++
  }
}

/**
 * Navigate to previous section
 */
export function prevSection() {
  if (stagedSectionIndex.value > 0) {
    stagedSectionIndex.value--
  }
}

/**
 * Send staged section live to projector
 * Note: This should be called alongside the presentation's goLive() in ControlView
 * to properly unstage the previous stack and stop auto-advance timers
 */
export function goLive() {
  liveSectionIndex.value = stagedSectionIndex.value
  lyricsCleared.value = false // Reset lyrics cleared state when going live
}

/**
 * Clear projection with two-stage behavior:
 * 1st call: Clear lyrics but keep background
 * 2nd call: Clear everything (black screen)
 */
export function clearProjection() {
  if (!lyricsCleared.value && liveSectionIndex.value !== null) {
    // First ESC: Clear lyrics but keep background
    lyricsCleared.value = true
  } else {
    // Second ESC (or ESC when already cleared): Full blackout
    liveSectionIndex.value = null
    lyricsCleared.value = false
  }
}

/**
 * Load background video for current song (per-song mode)
 */
function loadBackgroundVideoForCurrentSong() {
  const currentSong = activeWorshipStack.value?.currentSong
  if (!currentSong) return

  // Check if song has a background video assigned
  if (currentSong.presentation?.backgroundVideo) {
    currentBackgroundVideo.value = currentSong.presentation.backgroundVideo
  } else {
    // Fallback to first video in rotation list if available
    if (activeWorshipStack.value?.backgroundVideos?.length > 0) {
      currentBackgroundVideo.value = activeWorshipStack.value.backgroundVideos[0]
    }
  }
}

/**
 * Rotate to next background video (auto-rotate mode)
 */
function rotateBackgroundVideo() {
  if (!activeWorshipStack.value?.backgroundVideos?.length) return

  const videos = activeWorshipStack.value.backgroundVideos
  const currentIndex = videos.indexOf(currentBackgroundVideo.value)

  // Get next video (wrap around if at end)
  const nextIndex = (currentIndex + 1) % videos.length

  // Set up crossfade
  nextBackgroundVideo.value = videos[nextIndex]

  // After crossfade completes (handled by WorshipProjector), swap videos
  setTimeout(() => {
    currentBackgroundVideo.value = nextBackgroundVideo.value
    nextBackgroundVideo.value = null
  }, 3000) // 3 second crossfade duration
}

/**
 * Get setlist with song details
 * @param {Function} findSongById - Function to find song by ID (pass from component)
 */
export function useSetlist(findSongById) {
  const setlist = computed(() => {
    if (!activeWorshipStack.value?.setlist) return []

    return activeWorshipStack.value.setlist.map((songOrId, index) => {
      // Handle both song objects and IDs
      let song = songOrId
      if (typeof songOrId === 'string' && findSongById) {
        song = findSongById(songOrId)
      }

      return {
        id: song?.id || songOrId,
        index,
        title: song?.title || 'Unknown Song',
        artist: song?.artist || '',
        isCurrent: index === currentSongIndex.value
      }
    })
  })

  return {
    setlist,
    currentSongIndex
  }
}

/**
 * Check if worship mode is active
 */
export function isWorshipModeActive() {
  return computed(() => activeWorshipStack.value !== null)
}

/**
 * Get navigation constraints
 */
export function useWorshipNavigation() {
  const canGoPrevSection = computed(() => stagedSectionIndex.value > 0)
  const canGoNextSection = computed(() => {
    const sections = activeWorshipStack.value?.currentSong?.processed_sections
    if (!sections) return false
    return stagedSectionIndex.value < sections.length - 1
  })

  const canGoPrevSong = computed(() => currentSongIndex.value > 0)
  const canGoNextSong = computed(() => {
    if (!activeWorshipStack.value?.setlist) return false
    return currentSongIndex.value < activeWorshipStack.value.setlist.length - 1
  })

  return {
    canGoPrevSection,
    canGoNextSection,
    canGoPrevSong,
    canGoNextSong
  }
}

/**
 * Main worship composable
 * @param {Function} findSongById - Optional function to find song by ID
 */
export function useWorship(findSongById) {
  return {
    // State
    activeWorshipStack,
    currentSongIndex,
    stagedSectionIndex,
    liveSectionIndex,
    lyricsCleared,
    currentBackgroundVideo,
    nextBackgroundVideo,

    // Computed
    ...useCurrentSong(findSongById),
    ...useSetlist(findSongById),
    ...useWorshipNavigation(),
    isWorshipModeActive: isWorshipModeActive(),

    // Actions
    loadWorshipStack,
    exitWorshipMode,
    goToSong,
    nextSong,
    prevSong,
    stageSection,
    nextSection,
    prevSection,
    goLive,
    clearProjection
  }
}
