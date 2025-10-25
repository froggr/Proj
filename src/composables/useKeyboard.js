import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(callbacks) {
  const {
    onSpace,
    onArrowLeft,
    onArrowRight,
    onEscape
  } = callbacks

  function handleKeydown(event) {
    // Check if user is typing in an input field
    const activeElement = document.activeElement
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    )

    // Don't intercept keyboard shortcuts when typing in inputs
    if (isTyping && (event.code === 'Space' || event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
      return // Let the input handle it naturally
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault()
        if (onSpace) onSpace()
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (onArrowLeft) onArrowLeft()
        break
      case 'ArrowRight':
        event.preventDefault()
        if (onArrowRight) onArrowRight()
        break
      case 'Escape':
        event.preventDefault()
        if (onEscape) onEscape()
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    handleKeydown
  }
}
