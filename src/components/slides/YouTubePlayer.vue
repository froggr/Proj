<template>
  <div class="w-full h-full relative bg-black">
    <iframe
      v-if="youtubeUrl"
      ref="iframeRef"
      :key="`youtube-${videoId}-${autoplay ? 'auto' : 'manual'}`"
      :src="youtubeUrl"
      class="w-full h-full"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
    ></iframe>

    <!-- Black overlay that fades in when video ends -->
    <div
      class="absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none"
      :style="{ opacity: overlayOpacity }"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  videoId: {
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

const iframeRef = ref(null)
const playerState = ref(null)
const overlayOpacity = ref(0)
const endEventEmitted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)

let messageListener = null

// Generate YouTube embed URL
const youtubeUrl = computed(() => {
  if (!props.videoId) return null

  const params = {
    autoplay: props.autoplay ? 1 : 0,
    mute: props.muted ? 1 : 0,
    controls: props.showNativeControls ? 1 : 0,
    rel: 0,
    fs: props.showNativeControls ? 1 : 0,
    iv_load_policy: 3,
    disablekb: props.showNativeControls ? 0 : 1,
    enablejsapi: 1,
    origin: window.location.origin || 'http://localhost'
  }

  const queryString = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&')

  return `https://www.youtube-nocookie.com/embed/${props.videoId}?${queryString}`
})

// Setup YouTube iframe API listener
onMounted(() => {
  console.log('YouTubePlayer mounted, videoId:', props.videoId, 'autoplay:', props.autoplay, 'muted:', props.muted)

  messageListener = (event) => {
    // TEMPORARILY LOG ALL MESSAGES TO DEBUG
    console.log('[YouTubePlayer] Window received message from:', event.origin, 'data type:', typeof event.data)

    // TEMPORARILY REMOVED ORIGIN CHECK TO DEBUG
    // if (!event.origin.includes('youtube.com')) {
    //   return
    // }

    console.log('[YouTubePlayer] Processing message:', event.data)

    if (event.data && typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data)

        // Skip onReady events
        if (data.event === 'onReady') return

        // Handle onStateChange events
        if (data.event === 'onStateChange') {
          const state = data.info
          const previousState = playerState.value

          if (state !== previousState) {
            const stateNames = { '-1': 'unstarted', '0': 'ended', '1': 'playing', '2': 'paused', '3': 'buffering', '5': 'cued' }
            console.log('YouTube state changed:', stateNames[state] || `unknown (${state})`)
          }

          // State 0 = ended
          if (state == 0 && previousState != 0 && !endEventEmitted.value) {
            handleVideoEnded()
          }

          playerState.value = state
        }

        // Handle infoDelivery events (state updates)
        if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
          const state = data.info.playerState
          const videoCurrentTime = data.info.currentTime
          const videoDuration = data.info.duration

          // Update local state
          if (videoDuration) {
            duration.value = videoDuration
          }
          if (videoCurrentTime !== undefined) {
            currentTime.value = videoCurrentTime
          }
          isPlaying.value = state == 1

          // Broadcast state if requested
          if (props.broadcastState) {
            const stateObj = {
              currentTime: videoCurrentTime,
              duration: videoDuration,
              isPlaying: state == 1
            }
            emit('state-update', stateObj)

            // Also broadcast via IPC if available
            if (window.electronAPI?.notifyVideoState) {
              window.electronAPI.notifyVideoState(stateObj)
            }
          }

          // Check for video end
          if (state == 0 && playerState.value != 0 && !endEventEmitted.value) {
            handleVideoEnded()
          }

          playerState.value = state
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    }
  }

  window.addEventListener('message', messageListener)
})

onBeforeUnmount(() => {
  if (messageListener) {
    window.removeEventListener('message', messageListener)
  }
})

// Watch for video ID changes and setup iframe listener
watch(() => props.videoId, (newVideoId) => {
  // Reset state
  playerState.value = null
  overlayOpacity.value = 0
  endEventEmitted.value = false
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false

  if (newVideoId) {
    console.log('Setting up YouTube listener for video:', newVideoId)
    // Give iframe time to load - using nextTick to ensure iframe ref is set
    setTimeout(() => {
      if (iframeRef.value) {
        console.log('Iframe ready, sending listening message to YouTube')
        console.log('Iframe ref:', iframeRef.value)
        console.log('Iframe contentWindow:', iframeRef.value.contentWindow)

        // Tell YouTube to start sending events
        iframeRef.value.contentWindow.postMessage(
          '{"event":"listening","id":"' + newVideoId + '"}',
          '*'
        )

        // Request player info
        const requestInfo = () => {
          if (iframeRef.value && iframeRef.value.contentWindow) {
            iframeRef.value.contentWindow.postMessage(
              '{"event":"command","func":"getPlayerState","args":""}',
              '*'
            )
            iframeRef.value.contentWindow.postMessage(
              '{"event":"command","func":"getDuration","args":""}',
              '*'
            )
            iframeRef.value.contentWindow.postMessage(
              '{"event":"command","func":"getCurrentTime","args":""}',
              '*'
            )
          }
        }

        requestInfo()
        const intervalId = setInterval(requestInfo, 300)
        setTimeout(() => clearInterval(intervalId), 15000)
      } else {
        console.error('Iframe ref is null after timeout!')
      }
    }, 1000)
  }
}, { immediate: true })

function handleVideoEnded() {
  endEventEmitted.value = true
  console.log('YouTube video ended')

  // Fade in overlay
  overlayOpacity.value = 0
  setTimeout(() => {
    overlayOpacity.value = 1

    // Emit ended event after overlay fades in
    setTimeout(() => {
      console.log('YouTube - emitting ended event')
      emit('ended')
    }, 500)
  }, 100)
}

// Expose methods for external control
function play() {
  if (iframeRef.value) {
    iframeRef.value.contentWindow.postMessage(
      '{"event":"command","func":"playVideo","args":""}',
      '*'
    )
  }
}

function pause() {
  if (iframeRef.value) {
    iframeRef.value.contentWindow.postMessage(
      '{"event":"command","func":"pauseVideo","args":""}',
      '*'
    )
  }
}

function seek(time) {
  if (iframeRef.value) {
    iframeRef.value.contentWindow.postMessage(
      `{"event":"command","func":"seekTo","args":[${time}, true]}`,
      '*'
    )
  }
}

defineExpose({
  play,
  pause,
  seek,
  isPlaying
})
</script>
