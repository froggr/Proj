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
            :video-url="slide.videoUrl"
            :library-root="libraryRoot"
            :autoplay="false"
            :muted="true"
            :show-native-controls="false"
            :broadcast-state="false"
          />

          <!-- YouTube Video -->
          <YouTubePlayer
            v-else-if="slide && slide.type === 'youtube'"
            :video-id="slide.videoId"
            :autoplay="false"
            :muted="true"
            :show-native-controls="false"
            :broadcast-state="false"
          />

          <!-- No slide -->
          <div v-else class="text-gray-500 flex items-center justify-center h-full text-sm">
            No slide selected
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SlideRenderer from './SlideRenderer.vue'
import VideoPlayer from './VideoPlayer.vue'
import YouTubePlayer from './YouTubePlayer.vue'

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

// Unique key for transitions
const slideKey = computed(() => {
  if (!props.slide) return 'no-slide'
  if (props.slide.type === 'image') return `image-${props.slide.imageUrl}`
  if (props.slide.type === 'bible') return `bible-${props.slide.reference}`
  if (props.slide.type === 'custom') return `custom-${props.slide.html?.substring(0, 20)}`
  if (props.slide.type === 'youtube') return `youtube-${props.slide.videoId}`
  if (props.slide.type === 'video') return `video-${props.slide.videoUrl}`
  return `slide-${props.slide.type}`
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
</style>
