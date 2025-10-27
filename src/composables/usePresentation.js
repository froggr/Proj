import { ref, computed, watch } from 'vue'

// Stacks structure:
// [
//   {
//     id: '1',
//     title: 'Welcome',
//     autoAdvance: {
//       enabled: false,
//       delay: 5000,
//       videoAdvance: 'video-end', // 'video-end' or 'timer' (uses delay above)
//       repeat: false,
//       transition: 'fade'
//     },
//     slides: [
//       { type: 'image', imageUrl: '...', title: 'Welcome 1' },
//       { type: 'custom', html: '...', background: '#000', title: 'Welcome 2' }
//     ]
//   }
// ]

const stacks = ref([])

// Current staged stack and slide
const stagedStackIndex = ref(0)
const stagedSlideIndex = ref(0)

// Current live stack and slide
const liveStackIndex = ref(null)
const liveSlideIndex = ref(null)

// Library root for resolving asset URLs
const libraryRoot = ref(null)

// Text scale for projector (shared state)
const textScale = ref(100)

let watchInitialized = false
let debounceTimer = null
let autoAdvanceTimer = null

// Debounced function to update projector
function updateProjector(liveSlide, transitionType = 'none') {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(async () => {
    try {
      const projectorData = {
        slide: liveSlide,
        transition: transitionType,
        libraryRoot: libraryRoot.value,
        textScale: textScale.value
      }
      const dataJson = JSON.stringify(projectorData)
      console.log('Control: Sending to projector:', dataJson)
      if (window.electronAPI) {
        await window.electronAPI.updateProjector(dataJson)
        console.log('Control: Successfully sent to projector')
      }
    } catch (error) {
      console.error('Control: Failed to update projector:', error)
    }
  }, 50)
}

export function usePresentation() {
  // Initialize watch only once
  if (!watchInitialized) {
    watchInitialized = true

    // Watch for live slide changes and send to projector window
    watch([liveStackIndex, liveSlideIndex], ([newStackIndex, newSlideIndex]) => {
      const liveSlide = newStackIndex !== null && newSlideIndex !== null
        ? stacks.value[newStackIndex]?.slides[newSlideIndex]
        : null

      // Get transition type from stack settings
      const transitionType = newStackIndex !== null
        ? stacks.value[newStackIndex]?.autoAdvance?.transition || 'none'
        : 'none'

      updateProjector(liveSlide, transitionType)

      // Handle auto-advance if enabled
      if (liveSlide && newStackIndex !== null) {
        handleAutoAdvance(newStackIndex, newSlideIndex)
      }
    }, { flush: 'post' })

    // Watch for any state changes and broadcast to remote clients
    watch([stacks, stagedStackIndex, stagedSlideIndex, liveStackIndex, liveSlideIndex], () => {
      broadcastStateToRemote()
    }, { deep: true })

    // Listen for remote control commands
    if (window.electronAPI?.onRemoteCommand) {
      window.electronAPI.onRemoteCommand((event, data) => {
        console.log('Remote command received:', event, data)
        handleRemoteCommand(event, data)
      })
    }
  }

  // Broadcast presentation state to remote clients
  function broadcastStateToRemote() {
    if (!window.electronAPI?.broadcastPresentationState) return

    const state = {
      stacks: stacks.value.map(stack => ({
        id: stack.id,
        title: stack.title,
        slideCount: stack.slides.length,
        slides: stack.slides.map(slide => ({
          type: slide.type,
          title: slide.title || `${slide.type} slide`
        }))
      })),
      staged: {
        stackIndex: stagedStackIndex.value,
        slideIndex: stagedSlideIndex.value,
        stackTitle: stacks.value[stagedStackIndex.value]?.title,
        slideTitle: stacks.value[stagedStackIndex.value]?.slides[stagedSlideIndex.value]?.title
      },
      live: {
        stackIndex: liveStackIndex.value,
        slideIndex: liveSlideIndex.value,
        stackTitle: liveStackIndex.value !== null ? stacks.value[liveStackIndex.value]?.title : null,
        slideTitle: liveStackIndex.value !== null && liveSlideIndex.value !== null
          ? stacks.value[liveStackIndex.value]?.slides[liveSlideIndex.value]?.title
          : null
      }
    }

    window.electronAPI.broadcastPresentationState(state)
  }

  // Handle remote control commands
  function handleRemoteCommand(event, data) {
    switch (event) {
      case 'remote-stage-next':
        nextSlide()
        break
      case 'remote-stage-prev':
        prevSlide()
        break
      case 'remote-go-live':
        goLive()
        break
      case 'remote-clear':
        clearProjection()
        break
      case 'remote-stage-slide':
        if (data?.stackIndex !== undefined && data?.slideIndex !== undefined) {
          stageSlideInStack(data.stackIndex, data.slideIndex)
        }
        break
      case 'remote-next-stack':
        nextStack()
        break
      case 'remote-prev-stack':
        prevStack()
        break
    }
  }

  // Computed values
  const currentStack = computed(() => stacks.value[stagedStackIndex.value])
  const currentSlide = computed(() => currentStack.value?.slides[stagedSlideIndex.value])

  const liveStack = computed(() =>
    liveStackIndex.value !== null ? stacks.value[liveStackIndex.value] : null
  )
  const liveSlide = computed(() =>
    liveStackIndex.value !== null && liveSlideIndex.value !== null
      ? stacks.value[liveStackIndex.value]?.slides[liveSlideIndex.value]
      : null
  )

  // Navigation constraints
  const canGoPrevSlide = computed(() => stagedSlideIndex.value > 0)
  const canGoNextSlide = computed(() =>
    currentStack.value && stagedSlideIndex.value < currentStack.value.slides.length - 1
  )
  const canGoPrevStack = computed(() => stagedStackIndex.value > 0)
  const canGoNextStack = computed(() => stagedStackIndex.value < stacks.value.length - 1)

  // Auto-advance logic
  function handleAutoAdvance(stackIndex, slideIndex) {
    // Clear existing timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }

    const stack = stacks.value[stackIndex]
    if (!stack || !stack.autoAdvance.enabled) return

    const currentSlide = stack.slides[slideIndex]
    const { repeat, delay, videoAdvance } = stack.autoAdvance

    // For videos and YouTube, check if they should use timer or wait for video end
    if (currentSlide.type === 'video' || currentSlide.type === 'youtube') {
      if (videoAdvance === 'timer') {
        // Use timer for videos too
        autoAdvanceTimer = setTimeout(() => {
          goNextSlideInLiveStack(repeat)
        }, delay)
      } else if (videoAdvance === 'video-end') {
        // Wait for video to end - handled by onVideoComplete callback
        // No timer needed
      }
    } else {
      // For images, bible verses, custom slides - always use timer
      autoAdvanceTimer = setTimeout(() => {
        goNextSlideInLiveStack(repeat)
      }, delay)
    }
  }

  // Called when a video completes playing
  function onVideoComplete() {
    if (liveStackIndex.value === null || liveSlideIndex.value === null) return

    const stack = stacks.value[liveStackIndex.value]
    if (!stack || !stack.autoAdvance.enabled) return

    const currentSlide = stack.slides[liveSlideIndex.value]
    const { repeat, videoAdvance } = stack.autoAdvance

    // Only advance if it's a video/youtube slide and videoAdvance is set to 'video-end'
    const isVideoSlide = currentSlide.type === 'video' || currentSlide.type === 'youtube'
    const shouldAdvance = isVideoSlide && videoAdvance === 'video-end'

    console.log('onVideoComplete:', {
      stackIndex: liveStackIndex.value,
      slideIndex: liveSlideIndex.value,
      slideType: currentSlide.type,
      videoAdvance,
      shouldAdvance,
      repeat,
      totalSlides: stack.slides.length
    })

    if (shouldAdvance) {
      goNextSlideInLiveStack(repeat)
      console.log('After advance:', { stackIndex: liveStackIndex.value, slideIndex: liveSlideIndex.value })
    }
  }

  // Go to next slide in the live stack
  function goNextSlideInLiveStack(repeat = false) {
    if (liveStackIndex.value === null || liveSlideIndex.value === null) return

    const stack = stacks.value[liveStackIndex.value]
    if (!stack) return

    console.log('goNextSlideInLiveStack:', { currentSlide: liveSlideIndex.value, totalSlides: stack.slides.length, repeat, isAtEnd: liveSlideIndex.value >= stack.slides.length - 1 })

    if (liveSlideIndex.value < stack.slides.length - 1) {
      // Go to next slide in stack (only update LIVE, not staged)
      liveSlideIndex.value++
      console.log('Auto-advanced to next slide (live only):', liveSlideIndex.value)
      // Start auto-advance for the new slide
      handleAutoAdvance(liveStackIndex.value, liveSlideIndex.value)
    } else if (repeat) {
      // Loop back to first slide in stack (only update LIVE, not staged)
      console.log('At end of stack, looping back to first slide (live only)')

      // If already at slide 0 (single-slide stack), force a reload by clearing and resetting
      if (liveSlideIndex.value === 0) {
        console.log('Single-slide stack: forcing reload')
        // Temporarily clear to force Vue reactivity
        const tempIndex = liveSlideIndex.value
        liveSlideIndex.value = null
        // Use nextTick to ensure the clearing is processed
        setTimeout(() => {
          liveSlideIndex.value = tempIndex
          // Restart auto-advance
          handleAutoAdvance(liveStackIndex.value, liveSlideIndex.value)
        }, 50)
      } else {
        liveSlideIndex.value = 0
        // Start auto-advance for the first slide
        handleAutoAdvance(liveStackIndex.value, 0)
      }
    } else {
      // End of stack, stop auto-advance
      console.log('At end of stack, repeat is false, stopping')
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer)
        autoAdvanceTimer = null
      }
    }
  }

  // Core actions
  function goLive() {
    liveStackIndex.value = stagedStackIndex.value
    liveSlideIndex.value = stagedSlideIndex.value
  }

  function clearProjection() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    liveStackIndex.value = null
    liveSlideIndex.value = null
  }

  // Slide navigation (within current stack)
  function nextSlide() {
    if (canGoNextSlide.value) {
      stagedSlideIndex.value++
    }
  }

  function prevSlide() {
    if (canGoPrevSlide.value) {
      stagedSlideIndex.value--
    }
  }

  // Stack navigation
  function nextStack() {
    if (canGoNextStack.value) {
      stagedStackIndex.value++
      stagedSlideIndex.value = 0 // Reset to first slide in new stack
    }
  }

  function prevStack() {
    if (canGoPrevStack.value) {
      stagedStackIndex.value--
      stagedSlideIndex.value = 0 // Reset to first slide in new stack
    }
  }

  // Direct navigation
  function stageStack(stackIndex) {
    if (stackIndex >= 0 && stackIndex < stacks.value.length) {
      stagedStackIndex.value = stackIndex
      stagedSlideIndex.value = 0
    }
  }

  function stageSlideInStack(stackIndex, slideIndex) {
    if (stackIndex >= 0 && stackIndex < stacks.value.length) {
      const stack = stacks.value[stackIndex]
      if (slideIndex >= 0 && slideIndex < stack.slides.length) {
        stagedStackIndex.value = stackIndex
        stagedSlideIndex.value = slideIndex
      }
    }
  }

  // Stack management
  function addStack(title = 'New Stack') {
    const newStack = {
      id: Date.now().toString(),
      title,
      autoAdvance: {
        enabled: false,
        delay: 5000,
        videoAdvance: 'video-end', // 'video-end' or 'timer'
        repeat: false,
        transition: 'fade'
      },
      slides: []
    }
    stacks.value.push(newStack)
    return newStack.id
  }

  function removeStack(stackIndex) {
    if (stacks.value.length > 1 && stackIndex >= 0 && stackIndex < stacks.value.length) {
      stacks.value.splice(stackIndex, 1)

      // Adjust staged index if needed
      if (stagedStackIndex.value >= stacks.value.length) {
        stagedStackIndex.value = stacks.value.length - 1
        stagedSlideIndex.value = 0
      }

      // Clear live if it was the removed stack
      if (liveStackIndex.value === stackIndex) {
        clearProjection()
      } else if (liveStackIndex.value !== null && liveStackIndex.value > stackIndex) {
        liveStackIndex.value--
      }
    }
  }

  function updateStackSettings(stackIndex, autoAdvanceSettings) {
    if (stackIndex >= 0 && stackIndex < stacks.value.length) {
      stacks.value[stackIndex].autoAdvance = { ...autoAdvanceSettings }
    }
  }

  // Slide management
  function addSlideToStack(stackIndex, slide) {
    if (stackIndex >= 0 && stackIndex < stacks.value.length) {
      stacks.value[stackIndex].slides.push(slide)
    }
  }

  function removeSlideFromStack(stackIndex, slideIndex) {
    const stack = stacks.value[stackIndex]
    if (stack && slideIndex >= 0 && slideIndex < stack.slides.length) {
      stack.slides.splice(slideIndex, 1)

      // Adjust staged index if needed
      if (stagedStackIndex.value === stackIndex) {
        if (stack.slides.length === 0) {
          stagedSlideIndex.value = 0
        } else if (stagedSlideIndex.value >= stack.slides.length) {
          stagedSlideIndex.value = stack.slides.length - 1
        }
      }

      // Clear live if it was the removed slide
      if (liveStackIndex.value === stackIndex && liveSlideIndex.value === slideIndex) {
        clearProjection()
      }
    }
  }

  // Persistence
  function savePresentation() {
    const presentation = {
      title: 'Sunday Service',
      stacks: stacks.value
    }
    return JSON.stringify(presentation, null, 2)
  }

  function loadPresentation(jsonData) {
    try {
      const presentation = JSON.parse(jsonData)
      if (presentation.stacks && Array.isArray(presentation.stacks)) {
        stacks.value = presentation.stacks
        stagedStackIndex.value = 0
        stagedSlideIndex.value = 0
        clearProjection()
      }
    } catch (error) {
      console.error('Failed to load presentation:', error)
    }
  }

  return {
    // State
    stacks,
    currentStack,
    currentSlide,
    liveStack,
    liveSlide,
    stagedStackIndex,
    stagedSlideIndex,
    liveStackIndex,
    liveSlideIndex,
    libraryRoot,
    textScale,

    // Library management
    setLibraryRoot: (path) => { libraryRoot.value = path },

    // Navigation constraints
    canGoPrevSlide,
    canGoNextSlide,
    canGoPrevStack,
    canGoNextStack,

    // Actions
    goLive,
    clearProjection,
    nextSlide,
    prevSlide,
    nextStack,
    prevStack,
    stageStack,
    stageSlideInStack,

    // Stack management
    addStack,
    removeStack,
    updateStackSettings,

    // Slide management
    addSlideToStack,
    removeSlideFromStack,

    // Auto-advance
    onVideoComplete,

    // Persistence
    savePresentation,
    loadPresentation,

    // Utility
    watchActive: () => watchInitialized
  }
}
