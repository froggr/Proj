<template>
  <Modal :show="show" title="Edit Song Settings" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Song Info (read-only) -->
      <div class="bg-neutral-900/50 rounded-lg p-3">
        <div class="text-sm font-semibold text-neutral-200">{{ songTitle }}</div>
        <div class="text-xs text-neutral-500">Editing display settings</div>
      </div>

      <!-- Background Mode -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Background</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
            <input
              type="radio"
              v-model="formData.backgroundMode"
              value="none"
              class="text-gold-500"
            />
            <span class="text-sm text-neutral-200">None (Black)</span>
          </label>
          <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
            <input
              type="radio"
              v-model="formData.backgroundMode"
              value="single"
              class="text-gold-500"
            />
            <span class="text-sm text-neutral-200">Single Video</span>
          </label>
        </div>

        <!-- Video Picker -->
        <div v-if="formData.backgroundMode === 'single'" class="mt-2">
          <button
            @click="$emit('select-video', handleVideoSelected)"
            class="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-200"
          >
            {{ formData.backgroundVideo ? '✓ Video Selected' : 'Choose Video' }}
          </button>
        </div>
      </div>

      <!-- Background Opacity (only if video selected) -->
      <div v-if="formData.backgroundMode === 'single' && formData.backgroundVideo">
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Background Opacity: {{ Math.round(formData.backgroundOpacity * 100) }}%
        </label>
        <input
          type="range"
          v-model.number="formData.backgroundOpacity"
          min="0.1"
          max="1"
          step="0.1"
          class="w-full"
        />
      </div>

      <!-- Font Family -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Font Family</label>
        <select
          v-model="formData.fontFamily"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
          :style="{ fontFamily: formData.fontFamily }"
        >
          <option
            v-for="font in availableFonts"
            :key="font.value"
            :value="font.value"
            :style="{ fontFamily: font.value }"
          >
            {{ font.label }}
          </option>
        </select>
        <!-- Preview -->
        <div
          class="mt-2 p-3 bg-neutral-900 rounded-lg text-center text-lg"
          :style="{ fontFamily: formData.fontFamily, fontWeight: formData.fontWeight }"
        >
          Amazing Grace, how sweet the sound
        </div>
      </div>

      <!-- Font Weight -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Font Weight</label>
        <select
          v-model.number="formData.fontWeight"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
        >
          <option :value="400">Normal (400)</option>
          <option :value="500">Medium (500)</option>
          <option :value="600">Semi-Bold (600)</option>
          <option :value="700">Bold (700)</option>
          <option :value="800">Extra Bold (800)</option>
        </select>
      </div>

      <!-- Font Color -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Font Color</label>
        <select
          v-model="formData.fontColor"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
        >
          <option value="light">Light (White)</option>
          <option value="dark">Dark (Black)</option>
        </select>
      </div>

      <!-- Text Shadow Toggle -->
      <div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="formData.textShadow"
            class="w-4 h-4 text-gold-500 bg-neutral-800 border-neutral-700 rounded focus:ring-gold-500"
          />
          <span class="text-sm font-medium text-neutral-300">Enable Text Shadow</span>
        </label>
      </div>

      <!-- Lines Per Section -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Lines Per Section
          <span class="text-xs text-neutral-500 ml-1">(splits long sections)</span>
        </label>
        <input
          type="number"
          v-model.number="formData.linesPerSection"
          min="2"
          max="12"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
        />
      </div>

      <!-- Full Slide Preview -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Preview</label>
        <div class="relative aspect-video bg-black rounded-lg overflow-hidden">
          <!-- Background Video Preview -->
          <video
            v-if="formData.backgroundMode === 'single' && formData.backgroundVideo && resolvedVideoUrl"
            :src="resolvedVideoUrl"
            autoplay
            muted
            loop
            playsinline
            class="absolute inset-0 w-full h-full object-cover"
            :style="{ opacity: formData.backgroundOpacity }"
          />

          <!-- Lyrics Preview -->
          <div class="absolute inset-0 flex items-center justify-center p-6">
            <div
              class="text-center"
              :style="{
                fontFamily: formData.fontFamily,
                fontWeight: formData.fontWeight,
                color: formData.fontColor === 'dark' ? '#000000' : '#ffffff',
                textShadow: formData.textShadow
                  ? (formData.fontColor === 'dark'
                    ? '2px 2px 8px rgba(255, 255, 255, 0.9), 0 0 25px rgba(255, 255, 255, 0.7)'
                    : '2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 0, 0, 0.7)')
                  : 'none',
                fontSize: '1.5rem',
                lineHeight: 1.4
              }"
            >
              Amazing Grace, how sweet the sound<br />
              That saved a wretch like me<br />
              I once was lost, but now I'm found<br />
              Was blind, but now I see
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-2">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          class="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black rounded-lg transition-colors text-sm font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import Modal from './Modal.vue'
import { resolveAssetUrl } from '@/utils/assetResolver'

const props = defineProps({
  show: Boolean,
  slide: {
    type: Object,
    default: null
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'save', 'select-video'])

const formData = ref({
  backgroundMode: 'none',
  backgroundVideo: null,
  backgroundOpacity: 0.4,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 600,
  fontColor: 'light',
  textShadow: true,
  linesPerSection: 4
})

const songTitle = ref('')
const availableFonts = ref([])

// Resolve video URL for preview (use ref + watch instead of async computed)
const resolvedVideoUrl = ref(null)

watch(() => [formData.value.backgroundVideo, props.libraryRoot], async ([videoUrl, libRoot]) => {
  if (!videoUrl) {
    resolvedVideoUrl.value = null
    return
  }
  resolvedVideoUrl.value = await resolveAssetUrl(videoUrl, libRoot)
}, { immediate: true })

// Comprehensive list of common fonts to check
const fontsToCheck = [
  // System defaults
  { name: 'System Default', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', category: 'system' },

  // macOS system fonts
  { name: 'San Francisco', value: '-apple-system, BlinkMacSystemFont, sans-serif', category: 'sans' },
  { name: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, sans-serif', category: 'sans' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif', category: 'sans' },
  { name: 'Arial', value: 'Arial, sans-serif', category: 'sans' },
  { name: 'Avenir', value: 'Avenir, sans-serif', category: 'sans' },
  { name: 'Avenir Next', value: '"Avenir Next", Avenir, sans-serif', category: 'sans' },
  { name: 'Futura', value: 'Futura, sans-serif', category: 'sans' },
  { name: 'Gill Sans', value: '"Gill Sans", sans-serif', category: 'sans' },
  { name: 'Optima', value: 'Optima, sans-serif', category: 'sans' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif', category: 'sans' },
  { name: 'Verdana', value: 'Verdana, sans-serif', category: 'sans' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif', category: 'sans' },

  // Serif fonts
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif', category: 'serif' },
  { name: 'Times', value: 'Times, serif', category: 'serif' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'serif' },
  { name: 'Palatino', value: 'Palatino, "Palatino Linotype", serif', category: 'serif' },
  { name: 'Baskerville', value: 'Baskerville, serif', category: 'serif' },
  { name: 'Didot', value: 'Didot, serif', category: 'serif' },
  { name: 'Garamond', value: 'Garamond, serif', category: 'serif' },
  { name: 'Hoefler Text', value: '"Hoefler Text", serif', category: 'serif' },
  { name: 'Cochin', value: 'Cochin, serif', category: 'serif' },
  { name: 'Big Caslon', value: '"Big Caslon", serif', category: 'serif' },

  // Display/Decorative
  { name: 'Impact', value: 'Impact, "Arial Black", sans-serif', category: 'display' },
  { name: 'Copperplate', value: 'Copperplate, sans-serif', category: 'display' },
  { name: 'American Typewriter', value: '"American Typewriter", serif', category: 'display' },
  { name: 'Papyrus', value: 'Papyrus, cursive', category: 'display' },
  { name: 'Brush Script MT', value: '"Brush Script MT", cursive', category: 'display' },
  { name: 'Chalkboard', value: 'Chalkboard, cursive', category: 'display' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive', category: 'display' },
  { name: 'Marker Felt', value: '"Marker Felt", cursive', category: 'display' },
  { name: 'SignPainter', value: 'SignPainter, cursive', category: 'display' },
  { name: 'Snell Roundhand', value: '"Snell Roundhand", cursive', category: 'display' },
  { name: 'Trattatello', value: 'Trattatello, cursive', category: 'display' },
  { name: 'Zapfino', value: 'Zapfino, cursive', category: 'display' },

  // Monospace
  { name: 'Courier New', value: '"Courier New", Courier, monospace', category: 'mono' },
  { name: 'Courier', value: 'Courier, monospace', category: 'mono' },
  { name: 'Monaco', value: 'Monaco, monospace', category: 'mono' },
  { name: 'Menlo', value: 'Menlo, monospace', category: 'mono' },
  { name: 'Consolas', value: 'Consolas, monospace', category: 'mono' },
  { name: 'Andale Mono', value: '"Andale Mono", monospace', category: 'mono' },

  // Windows fonts (if on PC)
  { name: 'Segoe UI', value: '"Segoe UI", sans-serif', category: 'sans' },
  { name: 'Calibri', value: 'Calibri, sans-serif', category: 'sans' },
  { name: 'Cambria', value: 'Cambria, serif', category: 'serif' },
  { name: 'Candara', value: 'Candara, sans-serif', category: 'sans' },
  { name: 'Constantia', value: 'Constantia, serif', category: 'serif' },
  { name: 'Corbel', value: 'Corbel, sans-serif', category: 'sans' },
]

// Check if a font is available using canvas measurement
function isFontAvailable(fontName) {
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  // Measure with fallback
  context.font = `${testSize} monospace`
  const baselineWidth = context.measureText(testString).width

  // Measure with test font
  context.font = `${testSize} ${fontName}, monospace`
  const testWidth = context.measureText(testString).width

  return Math.abs(testWidth - baselineWidth) > 1
}

// Detect available fonts on mount
onMounted(() => {
  availableFonts.value = fontsToCheck
    .filter(font => {
      // Always include system default
      if (font.category === 'system') return true

      // Extract first font name to test
      const firstFont = font.value.split(',')[0].replace(/['"]/g, '').trim()
      return isFontAvailable(firstFont)
    })
    .map(font => ({
      label: font.name,
      value: font.value,
      category: font.category
    }))

  console.log('Available fonts:', availableFonts.value.length, 'detected')
})

// Load form data when slide prop changes
watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    formData.value = {
      backgroundMode: newSlide.backgroundMode || 'none',
      backgroundVideo: newSlide.backgroundVideo || null,
      backgroundOpacity: newSlide.backgroundOpacity || 0.4,
      fontFamily: newSlide.fontFamily || 'system-ui, -apple-system, sans-serif',
      fontWeight: newSlide.fontWeight || 600,
      fontColor: newSlide.fontColor || 'light',
      textShadow: newSlide.textShadow !== undefined ? newSlide.textShadow : true,
      linesPerSection: newSlide.linesPerSection || 4
    }
    songTitle.value = newSlide.title || 'Song'
  }
}, { immediate: true })

function handleVideoSelected(videoUrl) {
  formData.value.backgroundVideo = videoUrl
}

function handleSave() {
  emit('save', formData.value)
}
</script>
