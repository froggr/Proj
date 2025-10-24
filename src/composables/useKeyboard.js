import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(callbacks) {
  const {
    onSpace,
    onArrowLeft,
    onArrowRight,
    onEscape
  } = callbacks

  function handleKeydown(event) {
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
