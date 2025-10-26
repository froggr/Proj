<template>
  <div class="w-screen h-screen bg-black relative">
    <Transition name="fade" mode="out-in">
      <SlidePreview
        v-if="liveSlide"
        :key="liveSlide ? 'slide' : 'empty'"
        :slide="liveSlide"
        :is-projector="true"
        :library-root="libraryRoot"
        :text-scale="textScale"
        :transitionType="transitionType"
        @video-ended="onVideoEnded"
        @youtube-ended="onYouTubeEnded"
      />
      <div v-else key="empty" class="w-full h-full bg-black"></div>
    </Transition>

    <!-- Splash Screen Overlay -->
    <Transition name="splash-fade">
      <div
        v-if="showSplash"
        class="absolute inset-0 flex items-center justify-center bg-black z-50"
      >
        <div class="text-center space-y-8 px-8">
          <!-- Logo -->
          <div class="flex items-center justify-center">
            <div class="relative">
              <!-- Glow effect -->
              <div class="absolute inset-0 blur-3xl opacity-40">
                <div class="w-40 h-40 bg-gold-500 rounded-full"></div>
              </div>
              <!-- Logo -->
              <div class="relative">
                <svg viewBox="189.42 64.02 448.8 437.25" class="w-40 h-40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 10px 30px rgba(216, 126, 56, 0.3));">
                  <path d="M208.137 242.386q19.612 0.135 39.221 -0.205c-0.067 7.24 -0.083 14.467 0.477 21.69 -2.043 0.884 -4.05 1.757 -5.843 3.106 -4.58 3.447 -7.45 8.427 -8.221 14.073 -1.006 7.364 -0.521 15.143 -0.496 22.574l0.118 36.149 -0.053 30.071c-0.019 5.976 -0.417 12.211 0.334 18.135 0.487 3.833 1.843 7.872 4.269 10.924 5.122 6.44 12.419 7.544 20.011 8.455 -0.084 4.712 -1.179 22.87 0.532 25.836l1.192 0.169c8.497 0.371 17.074 0.097 25.578 0.062 19.03 0.023 37.519 0.238 54.05 -10.756 16.009 -10.647 26.551 -27.872 30.331 -46.58 3.697 -18.301 0.576 -37.706 -9.854 -53.326 -9.761 -14.617 -23.098 -24.399 -40.41 -27.866 0.113 -5.131 0.525 -10.578 -0.72 -15.599 -1.65 -6.65 -6.076 -11.381 -11.817 -14.776 -0.484 -7.313 -0.054 -14.806 0.043 -22.136a118.69 118.69 0 0 1 77.453 33.765c22.461 22.303 35.561 54.593 35.655 86.196a122.944 122.944 0 0 1 -36.414 87.153 117.208 117.208 0 0 1 -69.354 33.189c-14.947 1.58 -30.321 0.882 -45.341 0.817l-60.714 -0.087c-0.407 -21.687 -0.044 -43.441 -0.061 -65.134z" fill="#EDE3D5"/>
                  <path d="M520.922 241.124c13.743 -1.531 29.318 1.468 42.304 5.968 27.621 9.571 52.617 29.082 65.481 55.683 -14.936 5.812 -29.685 12.565 -44.457 18.82 -10.621 -16.455 -25.034 -27.761 -44.449 -31.949a68.054 68.054 0 0 0 -51.999 9.969c-15.354 10.09 -24.408 24.38 -28.112 42.302 -4.452 21.539 -2.361 46.042 10.011 64.688a62.157 62.157 0 0 0 39.882 26.777c23.003 4.581 47.577 -1.501 63.849 -18.842 2.541 -2.708 8.416 -11.272 10.961 -12.745 0.471 -0.273 1.407 0.126 1.934 0.251q9.896 3.917 19.697 8.068c7.564 3.284 15.085 6.858 22.842 9.665 -10.652 21.483 -24.744 37.017 -45.711 48.788a120.189 120.189 0 0 1 -89.969 10.652c-23.595 -6.726 -46.419 -22.052 -61.066 -41.86 -5.056 -6.838 -9.019 -14.434 -13.144 -21.852a164.355 164.355 0 0 0 2.126 -5.181c12.479 -32.615 10.97 -71.058 -3.397 -102.661 5.47 -9.649 11.113 -19.094 18.519 -27.423 21.897 -24.623 52.292 -37.101 84.698 -39.117" fill="#EDE3D5"/>
                  <path d="M256.783 272.898c6.006 -0.258 12.101 0.041 18.12 -0.012 6.793 -0.06 14.077 -0.7 20.812 0.261 2.771 0.396 5.637 1.138 7.978 2.728 2.623 1.781 4.205 4.803 4.799 7.859 0.935 4.82 0.285 10.234 0.196 15.142q-0.113 8.097 -0.089 16.195l-0.108 42.267c0.007 8.322 0.373 16.763 -0.064 25.069 -0.13 2.48 -0.188 6.464 -1.688 8.503 -2.393 3.254 -6.229 4.156 -10.01 4.637q-11.671 -0.005 -23.34 0.153c-5.795 0.131 -11.789 0.761 -17.552 0.143 -2.378 -0.255 -5.301 -0.771 -7.252 -2.228 -2.542 -1.899 -3.815 -5.411 -4.104 -8.463 -0.539 -5.682 -0.143 -11.455 -0.087 -17.153l0.135 -28.162 -0.056 -35.234c-0.014 -6.419 -0.357 -13.082 0.169 -19.475 0.255 -3.098 0.508 -5.99 2.637 -8.423 2.517 -2.876 5.893 -3.567 9.504 -3.806" fill="#D87E38"/>
                  <path d="m258.312 163.529 37.03 -0.019c-0.222 16.382 -0.028 32.791 -0.03 49.175q-0.095 25.061 0.082 50.122c-12.267 -0.423 -24.913 -0.359 -37.177 0.086z" fill="#D87E38"/>
                  <path d="M275.123 70.928c0.19 -0.011 0.38 -0.025 0.571 -0.033 1.662 -0.073 3.837 0.047 4.994 1.4 2.697 3.154 1.001 22.072 0.85 26.968 1.772 1.197 3.7 2.445 5.251 3.925 1.573 1.5 2.67 3.26 3.224 5.367 1.781 6.773 0.756 14.574 0.694 21.498 -0.071 8.066 0.023 16.141 0.068 24.209l-12.221 -0.044 -15.152 0.037 -0.05 -22.696c-0.086 -7.356 -1.291 -15.898 0.662 -23.048 1.189 -4.351 4.236 -6.495 7.931 -8.636 -0.274 -7.09 -1.664 -18.708 0.06 -25.264 0.529 -2.015 1.414 -2.656 3.117 -3.682" fill="#D87E38"/>
                  <path d="M267.432 407.158c5.912 0.02 11.83 0.098 17.742 0.049 0.006 8.728 -0.148 17.496 0.082 26.219 -8.505 0.035 -17.082 0.309 -25.578 -0.062a260.229 260.229 0 0 1 7.807 -0.234c-0.01 -8.65 -0.182 -17.326 -0.053 -25.972" fill="#D87E38"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Brand Name -->
          <div>
            <p class="text-gold-500 text-2xl font-light tracking-wide">Projector Window</p>
          </div>

          <!-- Instructions -->
          <div class="space-y-4 max-w-lg mx-auto">
            <div class="flex items-start gap-3 text-left bg-neutral-900/50 border border-gold-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div class="flex-shrink-0 w-8 h-8 bg-gold-500/10 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-gold-500 font-bold text-sm">1</span>
              </div>
              <div>
                <p class="text-neutral-300 text-lg">Move this window to your projector screen</p>
              </div>
            </div>

            <div class="flex items-start gap-3 text-left bg-neutral-900/50 border border-gold-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div class="flex-shrink-0 w-8 h-8 bg-gold-500/10 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-gold-500 font-bold text-sm">2</span>
              </div>
              <div>
                <p class="text-neutral-300 text-lg">Press <kbd class="px-2 py-1 bg-neutral-800 border border-gold-500/30 rounded text-gold-400 font-mono text-sm">F11</kbd> to enter fullscreen</p>
              </div>
            </div>

            <div class="flex items-start gap-3 text-left bg-neutral-900/50 border border-gold-500/20 rounded-lg p-4 backdrop-blur-sm">
              <div class="flex-shrink-0 w-8 h-8 bg-gold-500/10 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-gold-500 font-bold text-sm">3</span>
              </div>
              <div>
                <p class="text-neutral-300 text-lg">Control slides from the main window</p>
              </div>
            </div>
          </div>

          <!-- Subtle hint -->
          <p class="text-neutral-600 text-sm italic">This message will disappear in 30 seconds or when you go live</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import SlidePreview from '../components/SlidePreview.vue'

console.log('ProjectorView: Script loading')

const liveSlide = ref(null)
const transitionType = ref('none')
const libraryRoot = ref(null)
const textScale = ref(100)
const showSplash = ref(true)
let splashTimer = null

// Hide splash when slide goes live
watch(liveSlide, (newSlide) => {
  console.log('ProjectorView: liveSlide changed to:', newSlide)
  if (newSlide && showSplash.value) {
    showSplash.value = false
    // Clear timer if splash is hidden by going live
    if (splashTimer) {
      clearTimeout(splashTimer)
      splashTimer = null
    }
  }
}, { immediate: true })

console.log('ProjectorView: About to call onMounted')

onMounted(() => {
  console.log('ProjectorView: onMounted called')

  // Hide splash after 30 seconds
  splashTimer = setTimeout(() => {
    showSplash.value = false
  }, 30000)

  // Listen for slide updates from the control window
  if (window.electronAPI) {
    console.log('ProjectorView: Setting up Electron listener')
    window.electronAPI.onUpdateSlide((slideData) => {
      try {
        console.log('ProjectorView: Received slide data:', slideData)
        const data = typeof slideData === 'string' ? JSON.parse(slideData) : slideData

        // Handle both old format (just slide) and new format (slide + transition + libraryRoot + textScale)
        if (data && typeof data === 'object' && 'slide' in data) {
          liveSlide.value = data.slide
          transitionType.value = data.transition || 'none'
          libraryRoot.value = data.libraryRoot || null
          textScale.value = data.textScale || 100
        } else {
          // Backward compatibility: treat as just a slide
          liveSlide.value = data
          transitionType.value = 'none'
          textScale.value = 100
        }
      } catch (error) {
        console.error('ProjectorView: Failed to parse slide data:', error)
        liveSlide.value = null
        transitionType.value = 'none'
        textScale.value = 100
      }
    })
    console.log('ProjectorView: Listener set up successfully')
  } else {
    console.error('ProjectorView: electronAPI not available!')
  }
})

onUnmounted(() => {
  // Clean up splash timer
  if (splashTimer) {
    clearTimeout(splashTimer)
    splashTimer = null
  }

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

<style scoped>
/* Fade transition for clearing projection */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Splash screen fade transition */
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.8s ease;
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}
</style>
