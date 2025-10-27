<template>
  <Transition name="slide-up">
    <div
      v-if="showControls"
      class="w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-t-2 border-gold-500 shadow-2xl"
    >
      <div class="px-6 py-4">
        <!-- Header: Status indicator -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
            <span class="text-gold-400 text-xs font-semibold uppercase tracking-wider">
              Live on Projector
            </span>
            <span class="text-neutral-400 text-xs">
              {{ videoType === 'youtube' ? 'YouTube' : 'Video' }}
            </span>
          </div>

          <!-- Time Display -->
          <div class="text-neutral-300 font-mono text-sm tabular-nums">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>

        <!-- Timeline Scrubber -->
        <div class="mb-4">
          <div
            @click="handleTimelineClick"
            @mouseenter="isTimelineHovered = true"
            @mouseleave="handleTimelineLeave"
            @mousemove="handleTimelineHover"
            class="h-3 bg-neutral-700 rounded-full cursor-pointer relative group transition-all"
            :class="{ 'h-4': isTimelineHovered }"
          >
            <!-- Progress Bar -->
            <div
              class="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full shadow-lg"
              :style="{ width: progressPercent + '%' }"
            ></div>

            <!-- Playhead -->
            <div
              v-if="progressPercent > 0"
              class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-gold-500 transition-all pointer-events-none"
              :class="{ 'w-5 h-5': isTimelineHovered }"
              :style="{ left: progressPercent + '%', marginLeft: '-8px' }"
            ></div>

            <!-- Hover Time Tooltip -->
            <Transition name="fade-fast">
              <div
                v-if="isTimelineHovered && hoverTime !== null"
                class="absolute bottom-full mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded shadow-lg border border-neutral-700 pointer-events-none"
                :style="{ left: hoverPercent + '%', transform: 'translateX(-50%)' }"
              >
                {{ formatTime(hoverTime) }}
              </div>
            </Transition>
          </div>
        </div>

        <!-- Controls Row -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Play/Pause Button -->
            <button
              @click="togglePlayPause"
              class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 rounded-xl transition-all shadow-lg hover:shadow-gold-500/50 hover:scale-105 active:scale-95"
              :title="isPlaying ? 'Pause' : 'Play'"
            >
              <!-- Play Icon -->
              <svg v-if="!isPlaying" class="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <!-- Pause Icon -->
              <svg v-else class="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>

            <!-- Skip Back 10s -->
            <button
              @click="skipBackward"
              class="w-10 h-10 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-all relative"
              title="Rewind 10 seconds"
            >
              <div class="relative w-6 h-6 flex items-center justify-center">
                <svg class="w-6 h-6 text-neutral-200 absolute" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h-3m0 0l2.5-2.5M1.5 12l2.5 2.5"/>
                </svg>
                <span class="text-[9px] font-bold text-neutral-200 relative z-10">10</span>
              </div>
            </button>

            <!-- Skip Forward 10s -->
            <button
              @click="skipForward"
              class="w-10 h-10 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-all relative"
              title="Forward 10 seconds"
            >
              <div class="relative w-6 h-6 flex items-center justify-center">
                <svg class="w-6 h-6 text-neutral-200 absolute" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h3m0 0l-2.5-2.5m2.5 2.5l-2.5 2.5"/>
                </svg>
                <span class="text-[9px] font-bold text-neutral-200 relative z-10">10</span>
              </div>
            </button>
          </div>

          <!-- Progress Indicator -->
          <div class="text-xs text-neutral-400">
            <span class="text-neutral-300 font-semibold">{{ Math.round(progressPercent) }}%</span> complete
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  liveSlide: {
    type: Object,
    default: null
  }
})

const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const isTimelineHovered = ref(false)
const hoverTime = ref(null)
const hoverPercent = ref(0)

let updateInterval = null
let lastSyncTime = 0

// Show controls only when live slide is video or youtube
const showControls = computed(() => {
  return props.liveSlide &&
         (props.liveSlide.type === 'video' || props.liveSlide.type === 'youtube') &&
         duration.value > 0
})

const videoType = computed(() => props.liveSlide?.type)

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

// Reset state when live slide changes
watch(() => props.liveSlide, () => {
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false
  hoverTime.value = null

  // Clear interval if exists
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
})

// Start/stop local time tracking based on playing state
watch(() => isPlaying.value, (playing) => {
  if (playing) {
    // Start interval to update time locally (smooth playback)
    if (updateInterval) clearInterval(updateInterval)

    updateInterval = setInterval(() => {
      if (isPlaying.value && currentTime.value < duration.value) {
        currentTime.value += 0.1 // Update every 100ms
      }
    }, 100)
  } else {
    // Stop interval when paused
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  }
})

// Listen for state updates from projector via IPC (periodic sync)
onMounted(() => {
  if (window.electronAPI?.onVideoStateUpdate) {
    window.electronAPI.onVideoStateUpdate((state) => {
      const now = Date.now()

      // Sync duration always
      if (state.duration) {
        duration.value = state.duration
      }

      // Only sync currentTime if:
      // 1. More than 1 second has passed since last sync (periodic correction)
      // 2. Or difference is more than 0.5 seconds (drift correction)
      // 3. Or if we just started playing/paused
      const timeDiff = Math.abs(state.currentTime - currentTime.value)
      const shouldSync = (now - lastSyncTime > 1000) || (timeDiff > 0.5) || (state.isPlaying !== isPlaying.value)

      if (shouldSync) {
        currentTime.value = state.currentTime || 0
        lastSyncTime = now
      }

      // Always sync playing state
      isPlaying.value = state.isPlaying || false
    })
  }
})

onBeforeUnmount(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }

  if (window.electronAPI?.removeVideoStateListener) {
    window.electronAPI.removeVideoStateListener()
  }
})

function togglePlayPause() {
  if (window.electronAPI?.controlProjectorVideo) {
    window.electronAPI.controlProjectorVideo('toggle-play-pause')
  }
}

function skipBackward() {
  const newTime = Math.max(0, currentTime.value - 10)
  seekTo(newTime)
}

function skipForward() {
  const newTime = Math.min(duration.value, currentTime.value + 10)
  seekTo(newTime)
}

function seekTo(time) {
  if (window.electronAPI?.controlProjectorVideo) {
    window.electronAPI.controlProjectorVideo('seek', { time })
  }
}

function handleTimelineClick(event) {
  if (!duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = Math.max(0, Math.min(1, clickX / rect.width))
  const newTime = percent * duration.value

  seekTo(newTime)
}

function handleTimelineHover(event) {
  if (!duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const hoverX = event.clientX - rect.left
  const percent = Math.max(0, Math.min(1, hoverX / rect.width))

  hoverPercent.value = percent * 100
  hoverTime.value = percent * duration.value
}

function handleTimelineLeave() {
  isTimelineHovered.value = false
  hoverTime.value = null
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* Slide-up transition for controls appearing */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Fast fade for tooltip */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

/* Subtle pulse animation for live indicator */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
