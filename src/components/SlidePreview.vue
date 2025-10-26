<template>
  <div class="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
    <div
      :style="{
        position: 'absolute',
        width: '960px',
        height: '540px',
        transform: scale !== 1 ? `scale(${scale})` : 'none',
        transformOrigin: 'center center',
        left: '50%',
        top: '50%',
        marginLeft: '-480px',
        marginTop: '-270px'
      }"
    >
      <Transition :name="transitionType" mode="out-in">
        <div
          v-if="!slide && !isProjector"
          :key="'no-slide'"
          class="text-gray-500 flex items-center justify-center h-full"
          :style="{ fontSize: '14px' }"
        >
          No slide selected
        </div>

        <div v-else-if="slide && slide.type === 'image'" :key="`image-${slide.imageUrl}`" class="w-full h-full">
          <img
            v-if="resolvedImageUrl"
            :src="resolvedImageUrl"
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
            padding: '43px 96px'
          }"
        >
          <div class="text-center" :style="{ maxWidth: '768px' }">
            <div
              class="font-semibold text-gray-400"
              :style="{ fontSize: scaledFontSizes.bibleReference, marginBottom: '22px' }"
            >
              {{ slide.reference }}
            </div>
            <div
              :style="{
                fontFamily: slide.font || 'Inter',
                fontSize: scaledFontSizes.bibleText,
                lineHeight: '1.6'
              }"
            >
              {{ slide.text }}
            </div>
            <div
              class="text-gray-500"
              :style="{ fontSize: scaledFontSizes.bibleTranslation, marginTop: '22px' }"
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
            v-if="resolvedVideoUrl"
            ref="videoRef"
            :key="resolvedVideoUrl"
            :src="resolvedVideoUrl"
            class="max-w-full max-h-full"
            :controls="!isProjector"
            :autoplay="isProjector"
            :muted="!isProjector"
            playsinline
            preload="auto"
            @loadeddata="() => {
              // Successfully loaded - reset retry count
              videoRetryCount.value = 0
            }"
            @error="(e) => {
              const video = e.target
              const error = video.error
              console.error('Video error:', {
                code: error?.code,
                message: error?.message,
                MEDIA_ERR_ABORTED: error?.code === 1,
                MEDIA_ERR_NETWORK: error?.code === 2,
                MEDIA_ERR_DECODE: error?.code === 3,
                MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
                src: video.src,
                networkState: video.networkState,
                readyState: video.readyState,
                retryAttempt: videoRetryCount.value
              })
              // Retry loading the video
              retryVideoLoad()
            }"
            @ended="onVideoEnded"
          />
          <div v-else class="text-neutral-500 text-sm">
            Loading video...
          </div>
        </div>

        <div
          v-else-if="slide && slide.type === 'custom'"
          :key="`custom-${slide.html.substring(0, 20)}`"
          class="w-full h-full flex items-center justify-center custom-slide-container"
          :style="{
            backgroundColor: slide.background || '#1a1a1a',
            padding: '43px 96px',
            fontSize: scaledFontSizes.customText
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

    <!-- Video Controls (only show in control window for video/YouTube slides when staged) -->
    <div
      v-if="!isProjector && isStaged && (slide?.type === 'video' || slide?.type === 'youtube') && duration > 0"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-8"
    >
      <div class="space-y-2">
        <!-- Timeline -->
        <div
          @click="handleTimelineClick"
          class="h-2 bg-neutral-700 rounded-full cursor-pointer hover:bg-neutral-600 transition-colors relative group"
        >
          <!-- Progress -->
          <div
            class="h-full bg-gold-500 rounded-full transition-all"
            :style="{ width: `${(currentTime / duration) * 100}%` }"
          ></div>
          <!-- Hover indicator -->
          <div
            class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            :style="{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-6px' }"
          ></div>
        </div>

        <!-- Controls Row -->
        <div class="flex items-center justify-between text-white text-sm">
          <div class="flex items-center gap-3">
            <!-- Play/Pause Button -->
            <button
              @click="togglePlayPause"
              class="w-8 h-8 flex items-center justify-center bg-gold-500 hover:bg-gold-600 rounded-full transition-colors"
            >
              <svg v-if="!isPlaying" class="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>

            <!-- Time Display -->
            <div class="text-neutral-300 font-mono text-xs">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
          </div>

          <!-- Video Type Badge -->
          <div class="text-xs text-neutral-400 uppercase tracking-wide">
            {{ slide.type === 'youtube' ? 'YouTube' : 'Video' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Global cache for resolved asset URLs (shared across all component instances)
const assetUrlCache = new Map()

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
  },
  libraryRoot: {
    type: String,
    default: null
  },
  textScale: {
    type: Number,
    default: 100 // 100 = 100% = 1.0x
  }
})

const emit = defineEmits(['video-ended', 'youtube-ended'])

// Compute scaled font sizes based on textScale prop
const scaledFontSizes = computed(() => {
  const multiplier = props.textScale / 100
  return {
    bibleReference: Math.round(14 * multiplier) + 'px',
    bibleText: Math.round(24 * multiplier) + 'px',
    bibleTranslation: Math.round(11 * multiplier) + 'px',
    customText: Math.round(27 * multiplier) + 'px'
  }
})

// Video/YouTube playback control state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const seeking = ref(false)

const videoRef = ref(null)
const youtubeVideoEnded = ref(false)
const youtubeOverlayOpacity = ref(0)
const youtubePlayerState = ref(null) // Track state to avoid duplicate events
const resolvedImageUrl = ref(null)
const resolvedVideoUrl = ref(null)
const videoRetryCount = ref(0)
const videoRetryTimer = ref(null)

// Resolve assets:// URLs to local-image:// URLs
async function resolveAssetUrl(assetUrl) {
  if (!assetUrl || !assetUrl.startsWith('assets://')) {
    return assetUrl
  }

  if (!props.libraryRoot || !window.electronAPI) {
    console.warn('SlidePreview: Cannot resolve asset URL - library not open or Electron API not available', {
      assetUrl,
      hasLibraryRoot: !!props.libraryRoot,
      hasElectronAPI: !!window.electronAPI
    })
    return assetUrl
  }

  // Check cache first
  const cacheKey = `${props.libraryRoot}::${assetUrl}`
  if (assetUrlCache.has(cacheKey)) {
    return assetUrlCache.get(cacheKey)
  }

  try {
    // resolveAssetPath now returns local-image:// URLs directly
    const resolvedUrl = await window.electronAPI.resolveAssetPath(props.libraryRoot, assetUrl)
    const finalUrl = resolvedUrl || assetUrl

    // Cache the result
    assetUrlCache.set(cacheKey, finalUrl)

    return finalUrl
  } catch (error) {
    console.error('Failed to resolve asset URL:', assetUrl, error)
    return assetUrl
  }
}

// Retry loading video on error (workaround for problematic video files)
function retryVideoLoad() {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 500 // ms

  if (videoRetryCount.value >= MAX_RETRIES) {
    console.error('Video failed to load after', MAX_RETRIES, 'retries')
    return
  }

  videoRetryCount.value++
  console.log(`Retrying video load (attempt ${videoRetryCount.value}/${MAX_RETRIES})...`)

  // Clear any existing timer
  if (videoRetryTimer.value) {
    clearTimeout(videoRetryTimer.value)
  }

  // Force reload by clearing and resetting the URL
  videoRetryTimer.value = setTimeout(() => {
    const currentUrl = resolvedVideoUrl.value
    resolvedVideoUrl.value = null

    setTimeout(() => {
      resolvedVideoUrl.value = currentUrl
    }, 50)
  }, RETRY_DELAY)
}

// Watch for slide changes and resolve URLs
// Also watch libraryRoot so URLs are re-resolved when library opens
watch([() => props.slide, () => props.libraryRoot], async ([newSlide]) => {
  // Reset retry count when slide changes
  videoRetryCount.value = 0
  if (videoRetryTimer.value) {
    clearTimeout(videoRetryTimer.value)
    videoRetryTimer.value = null
  }

  // Clear resolved URLs when slide changes
  resolvedImageUrl.value = null
  resolvedVideoUrl.value = null

  if (newSlide?.type === 'image' && newSlide.imageUrl) {
    resolvedImageUrl.value = await resolveAssetUrl(newSlide.imageUrl)
  }
  if (newSlide?.type === 'video' && newSlide.videoUrl) {
    resolvedVideoUrl.value = await resolveAssetUrl(newSlide.videoUrl)
  }
}, { immediate: true })

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
  console.log('Video ended - isProjector:', props.isProjector)

  if (props.isProjector) {
    // On projector: notify control window via IPC
    if (window.electronAPI?.notifyVideoEnded) {
      console.log('Projector: Notifying control window of video end')
      window.electronAPI.notifyVideoEnded()
    }
  } else {
    // On control window: emit local event for auto-advance
    emit('video-ended')
  }
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
            const videoCurrentTime = data.info.currentTime
            const videoDuration = data.info.duration
            const previousState = youtubePlayerState.value

            // Update playback tracking state
            if (videoDuration) {
              duration.value = videoDuration
            }
            if (videoCurrentTime !== undefined) {
              currentTime.value = videoCurrentTime
            }
            isPlaying.value = playerState == 1

            // On projector: broadcast state to control window
            if (props.isProjector && window.electronAPI?.notifyVideoState) {
              window.electronAPI.notifyVideoState({
                currentTime: videoCurrentTime,
                duration: videoDuration,
                isPlaying: playerState == 1
              })
            }

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

    // Set up IPC listeners based on window type
    if (props.isProjector) {
      // On projector: listen for video control commands from control window
      if (window.electronAPI?.onVideoControl) {
        window.electronAPI.onVideoControl((command, data) => {
          console.log('Projector: Received video control command:', command, data)

          if (command === 'toggle-play-pause') {
            if (props.slide?.type === 'youtube' && youtubeIframeRef.value) {
              const cmd = isPlaying.value ? 'pauseVideo' : 'playVideo'
              youtubeIframeRef.value.contentWindow.postMessage(
                `{"event":"command","func":"${cmd}","args":""}`,
                '*'
              )
            } else if (props.slide?.type === 'video' && videoRef.value) {
              if (isPlaying.value) {
                videoRef.value.pause()
              } else {
                videoRef.value.play()
              }
            }
          } else if (command === 'seek' && data?.time !== undefined) {
            if (props.slide?.type === 'youtube' && youtubeIframeRef.value) {
              youtubeIframeRef.value.contentWindow.postMessage(
                `{"event":"command","func":"seekTo","args":[${data.time}, true]}`,
                '*'
              )
            } else if (props.slide?.type === 'video' && videoRef.value) {
              videoRef.value.currentTime = data.time
            }
          }
        })
      }
    } else {
      // On control: listen for video state updates from projector
      if (window.electronAPI?.onVideoStateUpdate) {
        window.electronAPI.onVideoStateUpdate((state) => {
          currentTime.value = state.currentTime || 0
          duration.value = state.duration || 0
          isPlaying.value = state.isPlaying || false
        })
      }
    }
  }
})

// Clean up event listeners when component unmounts
onBeforeUnmount(() => {
  if (youtubeMessageListener && typeof window !== 'undefined') {
    window.removeEventListener('message', youtubeMessageListener)
  }

  // Clean up video retry timer
  if (videoRetryTimer.value) {
    clearTimeout(videoRetryTimer.value)
    videoRetryTimer.value = null
  }

  // Clean up IPC listeners
  if (window.electronAPI) {
    if (props.isProjector && window.electronAPI.removeVideoControlListener) {
      window.electronAPI.removeVideoControlListener()
    } else if (!props.isProjector && window.electronAPI.removeVideoStateListener) {
      window.electronAPI.removeVideoStateListener()
    }
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

// Video playback control functions
function togglePlayPause() {
  if (props.isProjector) {
    // On projector: execute the command locally
    if (props.slide?.type === 'youtube' && youtubeIframeRef.value) {
      const command = isPlaying.value ? 'pauseVideo' : 'playVideo'
      youtubeIframeRef.value.contentWindow.postMessage(
        `{"event":"command","func":"${command}","args":""}`,
        '*'
      )
    } else if (props.slide?.type === 'video' && videoRef.value) {
      if (isPlaying.value) {
        videoRef.value.pause()
      } else {
        videoRef.value.play()
      }
    }
  } else {
    // On control: send command to projector via IPC
    if (window.electronAPI?.controlProjectorVideo) {
      window.electronAPI.controlProjectorVideo('toggle-play-pause')
    }
  }
}

function seekTo(time) {
  if (props.isProjector) {
    // On projector: execute the seek locally
    if (props.slide?.type === 'youtube' && youtubeIframeRef.value) {
      youtubeIframeRef.value.contentWindow.postMessage(
        `{"event":"command","func":"seekTo","args":[${time}, true]}`,
        '*'
      )
    } else if (props.slide?.type === 'video' && videoRef.value) {
      videoRef.value.currentTime = time
    }
  } else {
    // On control: send command to projector via IPC
    if (window.electronAPI?.controlProjectorVideo) {
      window.electronAPI.controlProjectorVideo('seek', { time })
    }
  }
}

function handleTimelineClick(event) {
  if (!duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  const newTime = percent * duration.value

  seekTo(newTime)
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Track video playback state for regular videos
watch(() => videoRef.value, (video) => {
  if (!video) return

  const updateTime = () => {
    currentTime.value = video.currentTime
    duration.value = video.duration || 0

    // On projector: broadcast state to control window
    if (props.isProjector && window.electronAPI?.notifyVideoState) {
      window.electronAPI.notifyVideoState({
        currentTime: video.currentTime,
        duration: video.duration || 0,
        isPlaying: !video.paused
      })
    }
  }

  const updatePlaying = () => {
    isPlaying.value = !video.paused

    // On projector: broadcast state to control window
    if (props.isProjector && window.electronAPI?.notifyVideoState) {
      window.electronAPI.notifyVideoState({
        currentTime: video.currentTime,
        duration: video.duration || 0,
        isPlaying: !video.paused
      })
    }
  }

  video.addEventListener('timeupdate', updateTime)
  video.addEventListener('durationchange', updateTime)
  video.addEventListener('play', updatePlaying)
  video.addEventListener('pause', updatePlaying)
  video.addEventListener('loadedmetadata', updateTime)

  return () => {
    video.removeEventListener('timeupdate', updateTime)
    video.removeEventListener('durationchange', updateTime)
    video.removeEventListener('play', updatePlaying)
    video.removeEventListener('pause', updatePlaying)
    video.removeEventListener('loadedmetadata', updateTime)
  }
})

// Watch for YouTube videos on projector to unmute after autoplay starts
watch(() => [props.slide, props.isProjector], ([newSlide, isProj]) => {
  // Reset overlay state when slide changes
  youtubeVideoEnded.value = false
  youtubeOverlayOpacity.value = 0
  youtubePlayerState.value = null  // IMPORTANT: Reset state tracking for new video

  // Reset playback state
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0

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

        // Request player state to get duration (triggers infoDelivery)
        const requestInfo = () => {
          if (youtubeIframeRef.value) {
            youtubeIframeRef.value.contentWindow.postMessage(
              '{"event":"command","func":"getPlayerState","args":""}',
              '*'
            )
          }
        }

        // Request immediately and then every 500ms
        requestInfo()
        const intervalId = setInterval(requestInfo, 500)

        // Clear interval when slide changes (this watch will re-run)
        setTimeout(() => clearInterval(intervalId), 10000)

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
