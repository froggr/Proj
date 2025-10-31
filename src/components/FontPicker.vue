<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-neutral-300 mb-2">{{ label }}</label>

    <!-- Search Input -->
    <div class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        @focus="isOpen = true"
        @blur="handleBlur"
        @keydown="handleKeydown"
        type="text"
        :placeholder="selectedFontName || 'Search fonts...'"
        class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
        :style="{ fontFamily: modelValue }"
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs pointer-events-none">
        {{ filteredFonts.length }} fonts
      </div>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen && filteredFonts.length > 0"
      class="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl"
      @mousedown.prevent
    >
      <div
        v-for="(font, index) in filteredFonts"
        :key="font"
        @click="selectFont(font)"
        @mouseenter="highlightedIndex = index"
        class="px-3 py-2 cursor-pointer transition-colors text-sm"
        :class="{
          'bg-gold-500 text-black': highlightedIndex === index,
          'text-neutral-200 hover:bg-neutral-700': highlightedIndex !== index
        }"
        :style="{ fontFamily: font }"
      >
        {{ font }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'preview'])

const searchInput = ref(null)
const searchQuery = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(0)
const allFonts = ref([])
const isLoading = ref(true)

// Get selected font name (without fallbacks)
const selectedFontName = computed(() => {
  return props.modelValue.split(',')[0].replace(/['"]/g, '').trim()
})

// Filter fonts based on search
const filteredFonts = computed(() => {
  if (!searchQuery.value.trim()) {
    return allFonts.value
  }
  const query = searchQuery.value.toLowerCase()
  return allFonts.value.filter(font =>
    font.toLowerCase().includes(query)
  )
})

// Load system fonts on mount
onMounted(async () => {
  try {
    if (window.electronAPI?.getSystemFonts) {
      const fonts = await window.electronAPI.getSystemFonts()

      // Add system default at the top
      allFonts.value = [
        'system-ui, -apple-system, sans-serif',
        ...fonts.map(font => `"${font}", sans-serif`)
      ]

      console.log('Loaded system fonts:', allFonts.value.length)
    } else {
      console.warn('electronAPI.getSystemFonts not available')
      // Fallback to basic fonts
      allFonts.value = [
        'system-ui, -apple-system, sans-serif',
        'Arial, sans-serif',
        'Helvetica, sans-serif',
        'Times New Roman, serif',
        'Georgia, serif'
      ]
    }
  } catch (error) {
    console.error('Error loading fonts:', error)
    // Fallback to basic fonts
    allFonts.value = [
      'system-ui, -apple-system, sans-serif',
      'Arial, sans-serif'
    ]
  } finally {
    isLoading.value = false
  }
})

// Handle keyboard navigation
function handleKeydown(event) {
  if (!isOpen.value) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      isOpen.value = true
      event.preventDefault()
      return
    }
  }

  if (isOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredFonts.value.length - 1)
      scrollToHighlighted()
      previewHighlightedFont()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlighted()
      previewHighlightedFont()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (filteredFonts.value[highlightedIndex.value]) {
        selectFont(filteredFonts.value[highlightedIndex.value])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      isOpen.value = false
      searchQuery.value = ''
    }
  }
}

// Preview font as user navigates with keyboard
function previewHighlightedFont() {
  const font = filteredFonts.value[highlightedIndex.value]
  if (font) {
    emit('preview', font)
  }
}

// Scroll highlighted item into view
function scrollToHighlighted() {
  nextTick(() => {
    const dropdown = document.querySelector('.max-h-64.overflow-y-auto')
    const highlighted = dropdown?.children[highlightedIndex.value]
    if (highlighted && dropdown) {
      const dropdownRect = dropdown.getBoundingClientRect()
      const highlightedRect = highlighted.getBoundingClientRect()

      if (highlightedRect.bottom > dropdownRect.bottom) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      } else if (highlightedRect.top < dropdownRect.top) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  })
}

// Select a font
function selectFont(font) {
  emit('update:modelValue', font)
  emit('preview', font)
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = 0
}

// Handle blur with delay to allow click events
function handleBlur() {
  setTimeout(() => {
    isOpen.value = false
    searchQuery.value = ''
    highlightedIndex.value = 0
  }, 200)
}

// Reset highlighted index when filtered list changes
watch(filteredFonts, () => {
  highlightedIndex.value = 0
})
</script>
