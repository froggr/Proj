<template>
  <div class="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
    <div
      :style="scale !== 1 ? {
        position: 'absolute',
        width: '960px',
        height: '540px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        left: '50%',
        top: '50%',
        marginLeft: '-480px',
        marginTop: '-270px'
      } : {
        width: '100%',
        height: '100%'
      }"
    >
      <div v-if="!slide && !isProjector" class="text-gray-500 text-xl flex items-center justify-center h-full">
        No slide selected
      </div>

    <div v-else-if="slide && slide.type === 'image'" class="w-full h-full flex items-center justify-center">
      <img
        :key="slide.imageUrl"
        :src="slide.imageUrl"
        :alt="slide.title"
        class="max-w-full max-h-full object-contain"
        loading="lazy"
      />
    </div>

    <div
      v-else-if="slide && slide.type === 'bible'"
      class="w-full h-full flex items-center justify-center p-16"
      :style="{ backgroundColor: slide.background || '#1a1a1a' }"
    >
      <div class="text-center max-w-4xl">
        <div class="text-2xl font-semibold mb-8 text-gray-400">
          {{ slide.reference }}
        </div>
        <div
          class="text-4xl leading-relaxed"
          :style="{ fontFamily: slide.font || 'Inter' }"
        >
          {{ slide.text }}
        </div>
        <div class="text-xl mt-8 text-gray-500">
          {{ slide.translation }}
        </div>
      </div>
    </div>

    <div
      v-else-if="slide && slide.type === 'youtube'"
      class="w-full h-full relative"
    >
      <iframe
        v-if="youtubeUrl"
        ref="youtubeIframeRef"
        :key="`${slide.videoId}-${isProjector ? 'projector' : 'control'}`"
        :src="youtubeUrl"
        class="w-full h-full"
        frameborder="0"
        allow="autoplay; encrypted-media"
        allowfullscreen
      ></iframe>

      <!-- Overlay that fades in when video ends (always show to hide related videos) -->
      <div
        class="absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none"
        :style="{ opacity: youtubeOverlayOpacity }"
      ></div>
    </div>

    <div
      v-else-if="slide && slide.type === 'video'"
      class="w-full h-full flex items-center justify-center bg-black"
    >
      <video
        ref="videoRef"
        :key="slide.videoUrl"
        :src="slide.videoUrl"
        class="max-w-full max-h-full"
        :controls="!isProjector"
        :autoplay="isProjector"
        :muted="!isProjector"
        playsinline
        preload="auto"
        @ended="onVideoEnded"
      />
    </div>

    <div
      v-else-if="slide && slide.type === 'custom'"
      class="w-full h-full flex items-center justify-center p-16"
      :style="{ backgroundColor: slide.background || '#1a1a1a' }"
    >
      <div class="w-full h-full" v-html="slide.html"></div>
    </div>

    <div v-else-if="slide" class="text-gray-500 text-xl">
      Unknown slide type: {{ slide.type }}
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  slide: {
    type: Object,
    default: null
  },
  isProjector: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Number,
    default: 1
  },
  isStaged: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['video-ended', 'youtube-ended'])

const videoRef = ref(null)
const youtubeVideoEnded = ref(false)
const youtubeOverlayOpacity = ref(0)
const youtubePlayerState = ref(null) // Track state to avoid duplicate events

// YouTube iframe API
const youtubeUrl = computed(() => {
  if (props.slide?.type === 'youtube' && props.slide.videoId) {
    // Autoplay: ONLY on projector view
    const autoplay = props.isProjector ? 1 : 0
    // Mute: MUST be muted for autoplay to work (browser policy)
    const mute = 1

    // Build URL with parameters to configure YouTube UI
    // Note: rel=0 no longer works on embedded players (YouTube changed this)
    // We'll use CSS to hide related videos instead
    // modestbranding=1: minimal YouTube branding
    // fs=1: keep fullscreen for now (testing)
    // iv_load_policy=3: hide video annotations
    // controls=1: show controls for testing
    const url = `https://www.youtube.com/embed/${props.slide.videoId}?autoplay=${autoplay}&mute=${mute}&controls=1&modestbranding=1&iv_load_policy=3&enablejsapi=1`

    console.log('YouTube URL generated:', url, 'isProjector:', props.isProjector)
    return url
  }
  return null
})

const youtubeIframeRef = ref(null)

// Handle video ended event
function onVideoEnded() {
  emit('video-ended')
}

// Watch for video element changes - trigger autoplay for projector
watch(() => props.slide, (newSlide, oldSlide) => {
  if (newSlide?.type === 'video' && newSlide !== oldSlide && props.isProjector) {
    // Auto-play video when on projector
    setTimeout(() => {
      if (videoRef.value) {
        videoRef.value.play().catch(err => {
          console.error('Projector: Failed to auto-play video:', err)
        })
      }
    }, 100)
  }
}, { immediate: true })

// YouTube iframe messaging for video control and end detection
let youtubeMessageListener = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    youtubeMessageListener = (event) => {
      if (event.origin !== 'https://www.youtube.com') return

      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data)

          // Skip onReady events - just noise
          if (data.event === 'onReady') return

          // Handle onStateChange events (standard API)
          if (data.event === 'onStateChange') {
            const state = data.info
            const previousState = youtubePlayerState.value
            console.log('onStateChange received, state:', state, 'previous:', previousState)

            // Log state changes
            if (state !== previousState) {
              const stateNames = { '-1': 'unstarted', '0': 'ended', '1': 'playing', '2': 'paused', '3': 'buffering', '5': 'video cued' }
              console.log('YouTube state changed:', stateNames[state] || `unknown (${state})`)
            }

            // State 1 = playing, unmute on projector
            if (state == 1 && props.isProjector) {  // loose equality to handle string "1"
              if (youtubeIframeRef.value) {
                youtubeIframeRef.value.contentWindow.postMessage(
                  '{"event":"command","func":"unMute","args":""}',
                  '*'
                )
              }
            }

            // State 0 = ended - check BEFORE updating youtubePlayerState
            if (state == 0 && previousState != 0) {
              console.log('STATE 0 DETECTED - calling handleVideoEnded()')
              handleVideoEnded()
            }

            // NOW update the state for next time
            youtubePlayerState.value = state
          }

          // Handle infoDelivery events (sends playerState inside info object)
          if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
            const playerState = data.info.playerState
            const currentTime = data.info.currentTime
            const duration = data.info.duration
            const previousState = youtubePlayerState.value

            // Only log state changes, not every update
            if (playerState !== previousState) {
              const stateNames = { '-1': 'unstarted', '0': 'ended', '1': 'playing', '2': 'paused', '3': 'buffering', '5': 'video cued' }
              console.log('YouTube state changed:', stateNames[playerState] || `unknown (${playerState})`)
            }

            // Unmute when playing on projector
            if (playerState == 1 && props.isProjector) {  // loose equality to handle string "1"
              if (youtubeIframeRef.value) {
                youtubeIframeRef.value.contentWindow.postMessage(
                  '{"event":"command","func":"unMute","args":""}',
                  '*'
                )
              }
            }

            // Detect video end: playerState 0 means video ended
            // Just check that we haven't already processed this state
            if (playerState == 0 && previousState != 0) {
              console.log('infoDelivery: Video ended (state 0), calling handleVideoEnded()')
              handleVideoEnded()
            }

            // NOW update the state for next time
            youtubePlayerState.value = playerState
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    }

    window.addEventListener('message', youtubeMessageListener)
  }
})

// Clean up event listener when component unmounts
onBeforeUnmount(() => {
  if (youtubeMessageListener && typeof window !== 'undefined') {
    window.removeEventListener('message', youtubeMessageListener)
  }
})

// Helper function to handle video ended
function handleVideoEnded() {
  console.log('YouTube video ended - starting fade overlay')

  // Fade in overlay before emitting event
  youtubeOverlayOpacity.value = 0
  setTimeout(() => {
    youtubeOverlayOpacity.value = 1

    // Emit event after overlay fades in (triggers auto-advance)
    setTimeout(() => {
      console.log('YouTube - emitting end event for auto-advance')
      emit('youtube-ended')
    }, 500) // Give overlay time to fade in
  }, 100)
}

// Watch for YouTube videos on projector to unmute after autoplay starts
watch(() => [props.slide, props.isProjector], ([newSlide, isProj]) => {
  // Reset overlay state when slide changes
  youtubeVideoEnded.value = false
  youtubeOverlayOpacity.value = 0
  youtubePlayerState.value = null  // IMPORTANT: Reset state tracking for new video

  if (newSlide?.type === 'youtube') {
    // Give iframe time to load
    setTimeout(() => {
      if (youtubeIframeRef.value) {
        console.log('Setting up YouTube iframe listener for video:', newSlide.videoId)

        // Tell YouTube to start sending us events
        youtubeIframeRef.value.contentWindow.postMessage(
          '{"event":"listening","id":"' + newSlide.videoId + '"}',
          '*'
        )

        // If on projector, also unmute after autoplay
        if (isProj) {
          setTimeout(() => {
            if (youtubeIframeRef.value) {
              youtubeIframeRef.value.contentWindow.postMessage(
                '{"event":"command","func":"unMute","args":""}',
                '*'
              )
            }
          }, 500)
        }
      }
    }, 1000)
  }
})
</script>

<style scoped>
/* Custom slide styling */
</style>
