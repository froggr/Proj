<template>
  <div class="w-full h-full flex items-center justify-center bg-black">
    <video
      v-if="resolvedVideoUrl"
      ref="videoRef"
      :key="resolvedVideoUrl"
      :src="resolvedVideoUrl"
      class="max-w-full max-h-full"
      :controls="showNativeControls"
      :autoplay="autoplay"
      :muted="muted"
      :loop="loop"
      playsinline
      preload="auto"
      @loadeddata="onLoadedData"
      @error="onVideoError"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @durationchange="onDurationChange"
      @play="onPlay"
      @pause="onPause"
      @loadedmetadata="onLoadedMetadata"
    />
    <div v-else class="text-neutral-500 text-sm">
      Loading video...
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { resolveAssetUrl } from '@/utils/assetResolver'

const props = defineProps({
  videoUrl: {
    type: String,
    default: null
  },
  libraryRoot: {
    type: String,
    default: null
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: true
  },
  loop: {
    type: Boolean,
    default: false
  },
  showNativeControls: {
    type: Boolean,
    default: false
  },
  broadcastState: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['ended', 'state-update'])

const videoRef = ref(null)
const resolvedVideoUrl = ref(null)
const retryCount = ref(0)
const retryTimer = ref(null)
const isPlaying = ref(false)

const MAX_RETRIES = 2
const RETRY_DELAY = 800

// Resolve video URL
watch(() => [props.videoUrl, props.libraryRoot], async ([newUrl]) => {
  retryCount.value = 0
  if (retryTimer.value) {
    clearTimeout(retryTimer.value)
    retryTimer.value = null
  }

  if (newUrl) {
    resolvedVideoUrl.value = await resolveAssetUrl(newUrl, props.libraryRoot)
  } else {
    resolvedVideoUrl.value = null
  }
}, { immediate: true })

function onLoadedData() {
  retryCount.value = 0
}

function onVideoError(e) {
  const video = e.target
  const error = video.error
  console.error('Video error:', {
    code: error?.code,
    message: error?.message,
    src: video.src,
    originalUrl: props.videoUrl,
    libraryRoot: props.libraryRoot,
    retryAttempt: retryCount.value
  })

  // Provide helpful error messages
  if (error?.code === 4) {
    console.error('PIPELINE_ERROR_READ: This usually means:')
    console.error('  1. The video file doesn\'t exist at that path')
    console.error('  2. The file is corrupted or unreadable')
    console.error('  3. For background videos, try re-importing as category="backgrounds"')
    console.error('  4. Check the file exists:', video.src)
  }

  retryVideoLoad()
}

function retryVideoLoad() {
  if (retryCount.value >= MAX_RETRIES) {
    console.error('Video failed to load after', MAX_RETRIES, 'retries')
    return
  }

  retryCount.value++
  console.log(`Retrying video load (attempt ${retryCount.value}/${MAX_RETRIES})...`)

  if (retryTimer.value) {
    clearTimeout(retryTimer.value)
  }

  retryTimer.value = setTimeout(() => {
    const currentUrl = resolvedVideoUrl.value
    resolvedVideoUrl.value = null
    setTimeout(() => {
      resolvedVideoUrl.value = currentUrl
    }, 100)
  }, RETRY_DELAY)
}

function onEnded() {
  emit('ended')
}

function broadcastVideoState() {
  if (props.broadcastState && videoRef.value) {
    const state = {
      currentTime: videoRef.value.currentTime,
      duration: videoRef.value.duration || 0,
      isPlaying: isPlaying.value
    }
    emit('state-update', state)

    // Also broadcast via IPC if available
    if (window.electronAPI?.notifyVideoState) {
      window.electronAPI.notifyVideoState(state)
    }
  }
}

function onTimeUpdate() {
  broadcastVideoState()
}

function onDurationChange() {
  broadcastVideoState()
}

function onPlay() {
  isPlaying.value = true
  broadcastVideoState()
}

function onPause() {
  isPlaying.value = false
  broadcastVideoState()
}

function onLoadedMetadata() {
  broadcastVideoState()
}

// Expose video ref for external control (play/pause/seek)
defineExpose({
  play: () => videoRef.value?.play(),
  pause: () => videoRef.value?.pause(),
  seek: (time) => { if (videoRef.value) videoRef.value.currentTime = time },
  isPlaying
})
</script>
