<template>
  <div class="w-screen h-screen bg-black flex flex-col">
    <!-- Debug info -->
    <div class="absolute top-0 left-0 p-2 text-white text-xs bg-red-600 z-50">
      PROJECTOR VIEW - Listener: {{ listenerActive ? 'ACTIVE' : 'INACTIVE' }} - Events: {{ eventCount }}
    </div>

    <div class="flex-1">
      <SlidePreview :slide="liveSlide" :is-projector="true" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listen } from '@tauri-apps/api/event'
import SlidePreview from '../components/SlidePreview.vue'

const liveSlide = ref(null)
const listenerActive = ref(false)
const eventCount = ref(0)

onMounted(async () => {
  console.log('ProjectorView: MOUNTED!')

  // Set fullscreen (window is already positioned by Rust backend)
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const currentWindow = getCurrentWindow()

    // Small delay to let window initialize
    await new Promise(resolve => setTimeout(resolve, 100))

    await currentWindow.setFullscreen(true)
    console.log('ProjectorView: Set fullscreen')
  } catch (error) {
    console.error('ProjectorView: Failed to set fullscreen:', error)
  }

  // Listen for slide updates from the control window
  try {
    const unlisten = await listen('update-slide', (event) => {
      eventCount.value++
      console.log('ProjectorView: Received update-slide event #' + eventCount.value, event)

      try {
        const slideData = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload
        console.log('ProjectorView: Parsed slide data:', slideData)
        liveSlide.value = slideData
        console.log('ProjectorView: Updated liveSlide.value to:', liveSlide.value)
      } catch (error) {
        console.error('ProjectorView: Failed to parse slide data:', error, event.payload)
        liveSlide.value = null
      }
    })

    listenerActive.value = true
    console.log('ProjectorView: Event listener registered successfully')
  } catch (error) {
    console.error('ProjectorView: Failed to set up listener:', error)
    listenerActive.value = false
  }
})
</script>
