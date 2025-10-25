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
      <Transition :name="transitionType" mode="out-in">
        <div
          v-if="!slide && !isProjector"
          :key="'no-slide'"
          class="text-gray-500 flex items-center justify-center h-full"
          :style="{ fontSize: '2.5vh' }"
        >
          No slide selected
        </div>

        <div v-else-if="slide && slide.type === 'image'" :key="`image-${slide.imageUrl}`" class="w-full h-full">
          <img
            :src="slide.imageUrl"
            :alt="slide.title"
            class="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        <div
          v-else-if="slide && slide.type === 'bible'"
          :key="`bible-${slide.reference}-${slide.text.substring(0, 20)}`"
          class="w-full h-full flex items-center justify-center"
          :style="{
            backgroundColor: slide.background || '#1a1a1a',
            padding: '8vh 10vw'
          }"
        >
          <div class="text-center" :style="{ maxWidth: '80vw' }">
            <div
              class="font-semibold text-gray-400"
              :style="{ fontSize: '2.5vh', marginBottom: '4vh' }"
            >
              {{ slide.reference }}
            </div>
            <div
              :style="{
                fontFamily: slide.font || 'Inter',
                fontSize: '4.2vh',
                lineHeight: '1.6'
              }"
            >
              {{ slide.text }}
            </div>
            <div
              class="text-gray-500"
              :style="{ fontSize: '2vh', marginTop: '4vh' }"
            >
              {{ slide.translation }}
            </div>
          </div>
        </div>

        <div
          v-else-if="slide && slide.type === 'youtube'"
          :key="`youtube-${slide.videoId}`"
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
          :key="`video-${slide.videoUrl}`"
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
          :key="`custom-${slide.html.substring(0, 20)}`"
          class="w-full h-full flex items-center justify-center custom-slide-container"
          :style="{
            backgroundColor: slide.background || '#1a1a1a',
            padding: '8vh 10vw',
            fontSize: '5vh'
          }"
        >
          <div
            class="w-full"
            style="text-align: center; white-space: pre-wrap; line-height: 1.6;"
            v-html="slide.html"
          ></div>
        </div>

        <div
          v-else-if="slide"
          :key="`unknown-${slide.type}`"
          class="text-gray-500"
          :style="{ fontSize: '2.5vh' }"
        >
          Unknown slide type: {{ slide.type }}
        </div>
      </Transition>
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
  },
  transitionType: {
    type: String,
    default: 'none'
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
    // modestbranding=1: minimal YouTube branding
    // color=white: white progress bar (cleaner)
    // rel=0: show related videos from same channel only
    // fs=0: disable fullscreen button on projector (controlled from control window)
    // iv_load_policy=3: hide video annotations
    // controls: show on control window, hide on projector for minimal UI
    // disablekb=1: disable keyboard controls on projector
    const controls = props.isProjector ? 0 : 1
    const fs = props.isProjector ? 0 : 1
    const disablekb = props.isProjector ? 1 : 0
    const url = `https://www.youtube.com/embed/${props.slide.videoId}?autoplay=${autoplay}&mute=${mute}&controls=${controls}&modestbranding=1&color=white&rel=0&fs=${fs}&iv_load_policy=3&disablekb=${disablekb}&enablejsapi=1`

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
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* None transition - instant */
.none-enter-active,
.none-leave-active {
  transition: none;
}

/* Custom slide font scaling - override old <font> tags with relative sizes */
.custom-slide-container :deep(font[size="1"]),
.custom-slide-container :deep(span[style*="font-size: 0.7em"]) {
  font-size: 0.7em !important;
}

.custom-slide-container :deep(font[size="3"]),
.custom-slide-container :deep(span[style*="font-size: 1em"]) {
  font-size: 1em !important;
}

.custom-slide-container :deep(font[size="5"]),
.custom-slide-container :deep(span[style*="font-size: 1.5em"]) {
  font-size: 1.5em !important;
}

.custom-slide-container :deep(font[size="7"]),
.custom-slide-container :deep(span[style*="font-size: 2em"]) {
  font-size: 2em !important;
}
</style>
