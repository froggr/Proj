<template>
  <div class="w-screen h-screen bg-black">
    <SlidePreview
      :slide="liveSlide"
      :is-projector="true"
      :library-root="libraryRoot"
      :transitionType="transitionType"
      @video-ended="onVideoEnded"
      @youtube-ended="onYouTubeEnded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import SlidePreview from '../components/SlidePreview.vue'

console.log('ProjectorView: Script loading')

const liveSlide = ref(null)
const transitionType = ref('none')
const libraryRoot = ref(null)

// Watch for slide changes to debug
watch(liveSlide, (newSlide) => {
  console.log('ProjectorView: liveSlide changed to:', newSlide)
}, { immediate: true })

console.log('ProjectorView: About to call onMounted')

onMounted(() => {
  console.log('ProjectorView: onMounted called')

  // Listen for slide updates from the control window
  if (window.electronAPI) {
    console.log('ProjectorView: Setting up Electron listener')
    window.electronAPI.onUpdateSlide((slideData) => {
      try {
        console.log('ProjectorView: Received slide data:', slideData)
        const data = typeof slideData === 'string' ? JSON.parse(slideData) : slideData

        // Handle both old format (just slide) and new format (slide + transition + libraryRoot)
        if (data && typeof data === 'object' && 'slide' in data) {
          liveSlide.value = data.slide
          transitionType.value = data.transition || 'none'
          libraryRoot.value = data.libraryRoot || null
        } else {
          // Backward compatibility: treat as just a slide
          liveSlide.value = data
          transitionType.value = 'none'
        }
      } catch (error) {
        console.error('ProjectorView: Failed to parse slide data:', error)
        liveSlide.value = null
        transitionType.value = 'none'
      }
    })
    console.log('ProjectorView: Listener set up successfully')
  } else {
    console.error('ProjectorView: electronAPI not available!')
  }
})

onUnmounted(() => {
  if (window.electronAPI) {
    window.electronAPI.removeUpdateSlideListener()
  }
})

// Handle video/YouTube completion events
function onVideoEnded() {
  console.log('ProjectorView: Video ended, notifying control window')
  if (window.electronAPI) {
    window.electronAPI.notifyVideoEnded()
  }
}

function onYouTubeEnded() {
  console.log('ProjectorView: YouTube video ended, notifying control window')
  if (window.electronAPI) {
    window.electronAPI.notifyVideoEnded()
  }
}
</script>
