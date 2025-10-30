<template>
  <div class="w-full h-full bg-black flex items-center justify-center overflow-hidden">
    <div
      class="slide-container"
      :style="{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '16 / 9',
        margin: 'auto',
        position: 'relative',
        containerType: 'size'
      }"
    >
      <Transition :name="transitionType" mode="out-in">
        <div :key="slideKey" class="w-full h-full">
          <!-- Image, Bible, Custom slides -->
          <SlideRenderer
            v-if="slide && (slide.type === 'image' || slide.type === 'bible' || slide.type === 'custom')"
            :slide="slide"
            :text-scale="textScale"
            :library-root="libraryRoot"
          />

          <!-- Local Video -->
          <VideoPlayer
            v-else-if="slide && slide.type === 'video'"
            ref="videoPlayerRef"
            :video-url="slide.videoUrl"
            :library-root="libraryRoot"
            :autoplay="true"
            :muted="false"
            :show-native-controls="false"
            :broadcast-state="true"
            @ended="onVideoEnded"
          />

          <!-- YouTube Video -->
          <YouTubePlayer
            v-else-if="slide && slide.type === 'youtube'"
            ref="youtubePlayerRef"
            :video-id="slide.videoId"
            :autoplay="true"
            :muted="false"
            :show-native-controls="false"
            :broadcast-state="true"
            @ended="onYouTubeEnded"
          />

          <!-- Worship Section (song lyrics) -->
          <WorshipSectionProjector
            v-else-if="slide && slide.type === 'worship-section'"
            :slide="slide"
            :library-root="libraryRoot"
            :text-scale="textScale"
            :is-preview="false"
          />

          <!-- Empty (black screen) -->
          <div v-else class="w-full h-full bg-black"></div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import SlideRenderer from './SlideRenderer.vue'
import VideoPlayer from './VideoPlayer.vue'
import YouTubePlayer from './YouTubePlayer.vue'
import WorshipSectionProjector from './WorshipSectionProjector.vue'

const props = defineProps({
  slide: {
    type: Object,
    default: null
  },
  textScale: {
    type: Number,
    default: 100
  },
  libraryRoot: {
    type: String,
    default: null
  },
  transitionType: {
    type: String,
    default: 'none'
  }
})

const emit = defineEmits(['video-ended', 'youtube-ended'])

const videoPlayerRef = ref(null)
const youtubePlayerRef = ref(null)

// Unique key for transitions
const slideKey = computed(() => {
  if (!props.slide) return 'no-slide'
  if (props.slide.type === 'image') return `image-${props.slide.imageUrl}`
  if (props.slide.type === 'bible') return `bible-${props.slide.reference}`
  if (props.slide.type === 'custom') return `custom-${props.slide.html?.substring(0, 20)}`
  if (props.slide.type === 'youtube') return `youtube-${props.slide.videoId}`
  if (props.slide.type === 'video') return `video-${props.slide.videoUrl}`
  if (props.slide.type === 'worship-section') return `worship-${props.slide.songTitle}-${props.slide.sectionData.title}`
  return `slide-${props.slide.type}`
})

// Listen for control commands from control window via IPC
onMounted(() => {
  if (window.electronAPI?.onVideoControl) {
    window.electronAPI.onVideoControl((command, data) => {
      console.log('Projector: Received video control command:', command, data)

      if (command === 'toggle-play-pause') {
        if (props.slide?.type === 'youtube' && youtubePlayerRef.value) {
          // YouTube player has exposed play/pause methods
          if (youtubePlayerRef.value.isPlaying) {
            youtubePlayerRef.value.pause()
          } else {
            youtubePlayerRef.value.play()
          }
        } else if (props.slide?.type === 'video' && videoPlayerRef.value) {
          // Video player has exposed play/pause methods
          if (videoPlayerRef.value.isPlaying) {
            videoPlayerRef.value.pause()
          } else {
            videoPlayerRef.value.play()
          }
        }
      } else if (command === 'seek' && data?.time !== undefined) {
        if (props.slide?.type === 'youtube' && youtubePlayerRef.value) {
          youtubePlayerRef.value.seek(data.time)
        } else if (props.slide?.type === 'video' && videoPlayerRef.value) {
          videoPlayerRef.value.seek(data.time)
        }
      }
    })
  }
})

onBeforeUnmount(() => {
  if (window.electronAPI?.removeVideoControlListener) {
    window.electronAPI.removeVideoControlListener()
  }
})

function onVideoEnded() {
  console.log('Projector: Video ended')
  emit('video-ended')
}

function onYouTubeEnded() {
  console.log('Projector: YouTube ended')
  emit('youtube-ended')
}
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
</style>
