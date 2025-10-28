// Worship State Management
// Manages worship mode state: setlist, songs, sections, staging, and live output

import { ref, computed } from 'vue'
import { useSongLibrary } from '@/library/SongLibrary'

// Current worship stack data (when a worship stack is active)
const activeWorshipStack = ref(null) // { id, setlist: [songIds], backgroundMode, backgroundVideos }
const currentSongIndex = ref(0) // Index in setlist
const stagedSectionIndex = ref(0) // Currently staged section
const liveSectionIndex = ref(null) // Currently live section (null = nothing live)

// Background video state
const currentBackgroundVideo = ref(null) // Current video URL
const nextBackgroundVideo = ref(null) // Next video URL for crossfade

/**
 * Load a worship stack (called when clicking into a worship stack)
 * @param {Object} worshipStack - The worship stack data from presentation
 */
export function loadWorshipStack(worshipStack) {
  activeWorshipStack.value = worshipStack
  currentSongIndex.value = 0
  stagedSectionIndex.value = 0
  liveSectionIndex.value = null

  // Load first song's background video if in per-song mode
  if (worshipStack.backgroundMode === 'per-song') {
    loadBackgroundVideoForCurrentSong()
  } else if (worshipStack.backgroundMode === 'auto-rotate') {
    // Pick random video from rotation list
    if (worshipStack.backgroundVideos?.length > 0) {
      const randomIndex = Math.floor(Math.random() * worshipStack.backgroundVideos.length)
      currentBackgroundVideo.value = worshipStack.backgroundVideos[randomIndex]
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
  currentBackgroundVideo.value = null
  nextBackgroundVideo.value = null
}

/**
 * Get the current song from the setlist
 */
export function useCurrentSong() {
  const { findSongById } = useSongLibrary()

  const currentSong = computed(() => {
    if (!activeWorshipStack.value || !activeWorshipStack.value.setlist) return null
    const songId = activeWorshipStack.value.setlist[currentSongIndex.value]
    return findSongById(songId)
  })

  const stagedSection = computed(() => {
    if (!currentSong.value || !currentSong.value.sections) return null
    return currentSong.value.sections[stagedSectionIndex.value]
  })

  const liveSection = computed(() => {
    if (!currentSong.value || liveSectionIndex.value === null) return null
    return currentSong.value.sections[liveSectionIndex.value]
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
  const { currentSong } = useCurrentSong()

  if (!currentSong.value || !currentSong.value.sections) return

  if (index >= 0 && index < currentSong.value.sections.length) {
    stagedSectionIndex.value = index
  }
}

/**
 * Navigate to next section
 */
export function nextSection() {
  const { currentSong } = useCurrentSong()

  if (!currentSong.value || !currentSong.value.sections) return

  if (stagedSectionIndex.value < currentSong.value.sections.length - 1) {
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
 */
export function goLive() {
  liveSectionIndex.value = stagedSectionIndex.value
}

/**
 * Clear projection (blackout)
 */
export function clearProjection() {
  liveSectionIndex.value = null
}

/**
 * Load background video for current song (per-song mode)
 */
function loadBackgroundVideoForCurrentSong() {
  const { currentSong } = useCurrentSong()

  if (!currentSong.value) return

  // Check if song has a background video assigned
  if (currentSong.value.presentation?.backgroundVideo) {
    currentBackgroundVideo.value = currentSong.value.presentation.backgroundVideo
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
 */
export function useSetlist() {
  const { findSongById } = useSongLibrary()

  const setlist = computed(() => {
    if (!activeWorshipStack.value?.setlist) return []

    return activeWorshipStack.value.setlist.map((songId, index) => {
      const song = findSongById(songId)
      return {
        id: songId,
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
  const { currentSong } = useCurrentSong()

  const canGoPrevSection = computed(() => stagedSectionIndex.value > 0)
  const canGoNextSection = computed(() => {
    if (!currentSong.value?.sections) return false
    return stagedSectionIndex.value < currentSong.value.sections.length - 1
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

export function useWorship() {
  return {
    // State
    activeWorshipStack,
    currentSongIndex,
    stagedSectionIndex,
    liveSectionIndex,
    currentBackgroundVideo,
    nextBackgroundVideo,

    // Computed
    ...useCurrentSong(),
    ...useSetlist(),
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
