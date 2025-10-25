<template>
  <div class="w-screen h-screen bg-black">
    <SlidePreview :slide="liveSlide" :is-projector="true" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { listen } from '@tauri-apps/api/event'
import SlidePreview from '../components/SlidePreview.vue'

console.log('ProjectorView: Script loading')

const liveSlide = ref(null)

// Watch for slide changes to debug
watch(liveSlide, (newSlide) => {
  console.log('ProjectorView: liveSlide changed to:', newSlide)
}, { immediate: true })

console.log('ProjectorView: About to call onMounted')

onMounted(async () => {
  console.log('ProjectorView: onMounted called')
  // Set fullscreen before showing window to prevent flicker
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const currentWindow = getCurrentWindow()
    await currentWindow.setFullscreen(true)
  } catch (error) {
    console.error('ProjectorView: Failed to set fullscreen:', error)
  }

  // Listen for slide updates from the control window
  try {
    await listen('update-slide', (event) => {
      try {
        const slideData = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
        console.log('ProjectorView: Received slide data:', slideData)
        liveSlide.value = slideData
      } catch (error) {
        console.error('ProjectorView: Failed to parse slide data:', error)
        liveSlide.value = null
      }
    })
    console.log('ProjectorView: Listener set up successfully')
  } catch (error) {
    console.error('ProjectorView: Failed to set up listener:', error)
  }
})
</script>
