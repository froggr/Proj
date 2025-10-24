import { ref, computed, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const slides = ref([
  {
    type: 'image',
    imageUrl: 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=Welcome+to+Church',
    title: 'Welcome'
  },
  {
    type: 'bible',
    reference: 'John 3:16-17',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life. For God did not send his Son into the world to condemn the world, but to save the world through him.',
    translation: 'NIV',
    linesPerSlide: 3,
    font: 'Inter',
    background: '#1a1a1a'
  },
  {
    type: 'image',
    imageUrl: 'https://via.placeholder.com/1920x1080/1a1a1a/ffffff?text=Announcements',
    title: 'Announcements'
  }
])

const stagedIndex = ref(0)
const liveIndex = ref(null)

let watchInitialized = false

export function usePresentation() {
  // Initialize watch only once
  if (!watchInitialized) {
    watchInitialized = true

    // Watch for live slide changes and send to projector window
    watch(liveIndex, async (newLiveIndex) => {
      const liveSlide = newLiveIndex !== null ? slides.value[newLiveIndex] : null
      console.log('Control: Live index changed to:', newLiveIndex, 'Slide:', liveSlide)
      try {
        const slideJson = JSON.stringify(liveSlide)
        console.log('Control: Sending to projector:', slideJson)
        await invoke('update_projector', { slideData: slideJson })
        console.log('Control: Successfully sent to projector')
      } catch (error) {
        console.error('Control: Failed to update projector:', error)
      }
    })
  }
  const stagedSlide = computed(() => slides.value[stagedIndex.value])
  const liveSlide = computed(() =>
    liveIndex.value !== null ? slides.value[liveIndex.value] : null
  )

  const canGoPrev = computed(() => stagedIndex.value > 0)
  const canGoNext = computed(() => stagedIndex.value < slides.value.length - 1)

  function goLive() {
    liveIndex.value = stagedIndex.value
  }

  function nextSlide() {
    if (canGoNext.value) {
      stagedIndex.value++
    }
  }

  function prevSlide() {
    if (canGoPrev.value) {
      stagedIndex.value--
    }
  }

  function clearProjection() {
    liveIndex.value = null
  }

  function stageSlide(index) {
    if (index >= 0 && index < slides.value.length) {
      stagedIndex.value = index
    }
  }

  function addSlide(slide) {
    slides.value.push(slide)
  }

  function removeSlide(index) {
    if (slides.value.length > 1) {
      slides.value.splice(index, 1)
      if (stagedIndex.value >= slides.value.length) {
        stagedIndex.value = slides.value.length - 1
      }
      if (liveIndex.value !== null && liveIndex.value >= slides.value.length) {
        liveIndex.value = null
      }
    }
  }

  function savePresentation() {
    const presentation = {
      title: 'Sunday Service',
      slides: slides.value
    }
    return JSON.stringify(presentation, null, 2)
  }

  function loadPresentation(jsonData) {
    try {
      const presentation = JSON.parse(jsonData)
      if (presentation.slides && Array.isArray(presentation.slides)) {
        slides.value = presentation.slides
        stagedIndex.value = 0
        liveIndex.value = null
      }
    } catch (error) {
      console.error('Failed to load presentation:', error)
    }
  }

  return {
    slides,
    stagedSlide,
    liveSlide,
    stagedIndex,
    liveIndex,
    canGoPrev,
    canGoNext,
    goLive,
    nextSlide,
    prevSlide,
    clearProjection,
    stageSlide,
    addSlide,
    removeSlide,
    savePresentation,
    loadPresentation,
    watchActive: () => watchInitialized
  }
}
