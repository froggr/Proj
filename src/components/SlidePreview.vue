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
      class="w-full h-full"
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
import { computed, ref, watch, onMounted } from 'vue'

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

// YouTube iframe API
const youtubeUrl = computed(() => {
  if (props.slide?.type === 'youtube' && props.slide.videoId) {
    // Autoplay: ONLY on projector view
    const autoplay = props.isProjector ? 1 : 0
    // Mute: MUST be muted for autoplay to work (browser policy)
    const mute = 1

    // Use youtube.com (not youtube-nocookie) for better API support
    const url = `https://www.youtube.com/embed/${props.slide.videoId}?autoplay=${autoplay}&mute=${mute}&controls=1&rel=0&modestbranding=1&enablejsapi=1`

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
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data)

          // When video starts playing on projector, unmute it
          if (data.event === 'onStateChange' && data.info === 1 && props.isProjector) {
            // State 1 = playing, unmute immediately
            if (youtubeIframeRef.value) {
              youtubeIframeRef.value.contentWindow.postMessage(
                '{"event":"command","func":"unMute","args":""}',
                '*'
              )
            }
          }

          // YouTube video ended (state 0 = ended)
          if (data.event === 'onStateChange' && data.info === 0) {
            emit('youtube-ended')
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    })
  }
})

// Watch for YouTube videos on projector to unmute after autoplay starts
watch(() => [props.slide, props.isProjector], ([newSlide, isProj]) => {
  if (newSlide?.type === 'youtube' && isProj) {
    // Give iframe time to load and start playing
    setTimeout(() => {
      if (youtubeIframeRef.value) {
        youtubeIframeRef.value.contentWindow.postMessage(
          '{"event":"command","func":"unMute","args":""}',
          '*'
        )
      }
    }, 1000)
  }
})
</script>

<style scoped>
/* Custom slide styling */
</style>
