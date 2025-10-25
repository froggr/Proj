<template>
  <Modal :show="show" title="Add Bible Verse" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Reference
        </label>
        <input
          v-model="reference"
          type="text"
          placeholder="e.g., John 3:16-17"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Translation
        </label>
        <select
          v-model="translation"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NIV">NIV</option>
          <option value="ESV">ESV</option>
          <option value="KJV">KJV</option>
          <option value="NKJV">NKJV</option>
          <option value="NLT">NLT</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Verse Text
        </label>
        <textarea
          v-model="text"
          rows="6"
          placeholder="Paste the verse text here..."
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <p class="mt-2 text-xs text-gray-400">
          For now, paste the verse manually. We'll add API integration later.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Lines Per Slide
          </label>
          <input
            v-model.number="linesPerSlide"
            type="number"
            min="1"
            max="10"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Background Color
          </label>
          <input
            v-model="background"
            type="color"
            class="w-full h-[42px] bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
        >
          Cancel
        </button>
        <button
          @click="addSlide"
          :disabled="!reference || !text"
          class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          Add Slide
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

const emit = defineEmits(['close', 'add'])

defineProps({
  show: Boolean
})

const reference = ref('')
const translation = ref('NIV')
const text = ref('')
const linesPerSlide = ref(3)
const background = ref('#1a1a1a')

function addSlide() {
  // Split text into verses (by numbers at start of line or by periods)
  const verses = text.value
    .split(/(?=\d+)/) // Split before verse numbers
    .map(v => v.trim())
    .filter(v => v.length > 0)

  // Group verses by linesPerSlide
  const slides = []
  for (let i = 0; i < verses.length; i += linesPerSlide.value) {
    const chunk = verses.slice(i, i + linesPerSlide.value)
    const slideText = chunk.join(' ')

    slides.push({
      type: 'bible',
      reference: reference.value,
      text: slideText,
      translation: translation.value,
      linesPerSlide: linesPerSlide.value,
      font: 'Inter',
      background: background.value,
      title: `${reference.value} (${i / linesPerSlide.value + 1})`
    })
  }

  // Emit all slides (or single slide if no splitting needed)
  if (slides.length > 1) {
    slides.forEach(slide => emit('add', slide))
  } else {
    emit('add', slides[0] || {
      type: 'bible',
      reference: reference.value,
      text: text.value,
      translation: translation.value,
      linesPerSlide: linesPerSlide.value,
      font: 'Inter',
      background: background.value
    })
  }

  // Reset
  reference.value = ''
  text.value = ''
  translation.value = 'NIV'
  linesPerSlide.value = 3
  background.value = '#1a1a1a'
}
</script>
