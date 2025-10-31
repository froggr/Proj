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
        >
          <option value="Inter, sans-serif">Inter (Modern Sans)</option>
          <option value="'Playfair Display', serif">Playfair Display (Elegant Serif)</option>
          <option value="Montserrat, sans-serif">Montserrat (Bold Sans)</option>
          <option value="'Source Sans Pro', sans-serif">Source Sans Pro (Clean Sans)</option>
          <option value="Merriweather, serif">Merriweather (Traditional Serif)</option>
          <option value="Raleway, sans-serif">Raleway (Refined Sans)</option>
        </select>
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
import { ref, watch } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  show: Boolean,
  slide: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save', 'select-video'])

const formData = ref({
  backgroundMode: 'none',
  backgroundVideo: null,
  backgroundOpacity: 0.4,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontColor: 'light',
  linesPerSection: 4
})

const songTitle = ref('')

// Load form data when slide prop changes
watch(() => props.slide, (newSlide) => {
  if (newSlide) {
    formData.value = {
      backgroundMode: newSlide.backgroundMode || 'none',
      backgroundVideo: newSlide.backgroundVideo || null,
      backgroundOpacity: newSlide.backgroundOpacity || 0.4,
      fontFamily: newSlide.fontFamily || 'Inter, sans-serif',
      fontWeight: newSlide.fontWeight || 600,
      fontColor: newSlide.fontColor || 'light',
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
