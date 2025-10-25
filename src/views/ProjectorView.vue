<template>
  <div class="w-screen h-screen bg-black">
    <SlidePreview :slide="liveSlide" :is-projector="true" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import SlidePreview from '../components/SlidePreview.vue'

console.log('ProjectorView: Script loading')

const liveSlide = ref(null)

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
        const slide = typeof slideData === 'string' ? JSON.parse(slideData) : slideData
        liveSlide.value = slide
      } catch (error) {
        console.error('ProjectorView: Failed to parse slide data:', error)
        liveSlide.value = null
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
</script>
