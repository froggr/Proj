<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-xl font-semibold text-gold-500">{{ initialSlide ? 'Edit Custom Slide' : 'Create Custom Slide' }}</h2>
        <button
          @click="closeModal"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content: Side by Side -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left: Editor -->
        <div class="w-1/2 border-r border-neutral-800 p-6 overflow-y-auto space-y-4">
          <!-- Slide Title -->
          <div>
            <label class="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Slide Title
            </label>
            <input
              v-model="slideTitle"
              type="text"
              placeholder="e.g., Welcome, Announcements"
              class="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>

          <!-- Formatting Toolbar -->
          <div>
            <label class="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Formatting
            </label>
            <div class="flex items-center gap-2 p-2 bg-neutral-800 rounded-lg border border-neutral-700">
              <!-- Font Size -->
              <select
                v-model="fontSize"
                @change="applyFontSize"
                class="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-white text-xs"
              >
                <option value="0.7em">Small</option>
                <option value="1em">Normal</option>
                <option value="1.5em">Large</option>
                <option value="2.5em">Huge</option>
              </select>

              <div class="w-px h-4 bg-neutral-700"></div>

              <!-- Bold, Italic, Underline -->
              <button
                @click="execCommand('bold')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white font-bold transition-colors text-xs"
                title="Bold"
              >
                B
              </button>
              <button
                @click="execCommand('italic')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white italic transition-colors text-xs"
                title="Italic"
              >
                I
              </button>
              <button
                @click="execCommand('underline')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white underline transition-colors text-xs"
                title="Underline"
              >
                U
              </button>

              <div class="w-px h-4 bg-neutral-700"></div>

              <!-- Alignment -->
              <button
                @click="execCommand('justifyLeft')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white transition-colors text-xs"
                title="Align Left"
              >
                ⬅
              </button>
              <button
                @click="execCommand('justifyCenter')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white transition-colors text-xs"
                title="Align Center"
              >
                ↔
              </button>
              <button
                @click="execCommand('justifyRight')"
                class="px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded text-white transition-colors text-xs"
                title="Align Right"
              >
                ➡
              </button>

              <div class="w-px h-4 bg-neutral-700"></div>

              <!-- Text Color -->
              <label class="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-700 rounded cursor-pointer transition-colors">
                <span class="text-white text-xs">A</span>
                <input
                  v-model="textColor"
                  type="color"
                  @change="applyTextColor"
                  class="w-5 h-5 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <!-- Editor -->
          <div>
            <label class="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Content
            </label>
            <div
              ref="editorRef"
              contenteditable="true"
              @input="updateContent"
              class="w-full min-h-[200px] px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 overflow-auto custom-editor"
              style="max-height: 300px; white-space: pre-wrap; text-align: center; font-size: 20px; line-height: 1.5;"
            ></div>
          </div>

          <!-- Background Color -->
          <div>
            <label class="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide">
              Background Color
            </label>
            <div class="flex gap-2">
              <input
                v-model="backgroundColor"
                type="color"
                class="w-10 h-10 rounded cursor-pointer border border-neutral-700"
              />
              <input
                v-model="backgroundColor"
                type="text"
                placeholder="#1a1a1a"
                class="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
              />
            </div>
          </div>
        </div>

        <!-- Right: Live 16:9 Preview -->
        <div class="w-1/2 p-6 flex flex-col items-center justify-center bg-neutral-950">
          <div class="text-xs font-medium text-neutral-400 mb-4 uppercase tracking-wide">
            Live Preview (16:9)
          </div>

          <!-- 16:9 Preview Container -->
          <div class="relative" style="width: 640px; height: 360px;">
            <div
              class="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center"
              :style="{ backgroundColor }"
            >
              <div
                class="w-full h-full p-8 overflow-hidden flex items-center justify-center"
                style="font-size: 28px;"
              >
                <div
                  class="w-full custom-preview"
                  style="text-align: center; white-space: pre-wrap; line-height: 1.6;"
                  v-html="contentHtml"
                ></div>
              </div>
            </div>
            <!-- Gold border to show it's a preview -->
            <div class="absolute inset-0 border-2 border-gold-500/30 rounded-lg pointer-events-none"></div>
          </div>

          <div class="mt-4 text-[10px] text-neutral-600 text-center">
            This is how your slide will appear on the projector
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="closeModal"
          class="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          @click="addSlide"
          class="px-6 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-colors text-sm shadow-lg shadow-gold-500/20"
        >
          {{ initialSlide ? 'Update Slide' : 'Add Slide' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  initialSlide: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'add'])

const editorRef = ref(null)
const slideTitle = ref('')
const contentHtml = ref('Type your content here...')
const backgroundColor = ref('#1a1a1a')
const fontSize = ref('1em')
const textColor = ref('#ffffff')

// Watch for initialSlide changes to populate form when editing
watch(() => props.initialSlide, (slide) => {
  if (slide && slide.type === 'custom') {
    slideTitle.value = slide.title || ''
    contentHtml.value = slide.html || ''
    backgroundColor.value = slide.background || '#1a1a1a'
    // Need to wait for next tick to ensure editorRef is available
    setTimeout(() => {
      if (editorRef.value) {
        editorRef.value.innerHTML = contentHtml.value
      }
    }, 100)
  }
}, { immediate: true })

// Also watch for show prop to reload editor when dialog opens
watch(() => props.show, (isShown) => {
  if (isShown && editorRef.value && contentHtml.value) {
    editorRef.value.innerHTML = contentHtml.value
  }
})

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = contentHtml.value
  }
})

function execCommand(command, value = null) {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
}

function applyFontSize() {
  // Wrap selected text in span with relative font size
  const selection = window.getSelection()
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (selectedText) {
      const span = document.createElement('span')
      span.style.fontSize = fontSize.value
      span.textContent = selectedText
      range.deleteContents()
      range.insertNode(span)

      // Update content
      updateContent()
    }
  }
  editorRef.value?.focus()
}

function applyTextColor() {
  execCommand('foreColor', textColor.value)
}

function updateContent() {
  contentHtml.value = editorRef.value?.innerHTML || ''
}

function addSlide() {
  const slide = {
    type: 'custom',
    title: slideTitle.value || 'Custom Slide',
    html: contentHtml.value,
    background: backgroundColor.value
  }
  emit('add', slide)
  resetForm()
}

function closeModal() {
  emit('close')
  resetForm()
}

function resetForm() {
  slideTitle.value = ''
  contentHtml.value = 'Type your content here...'
  backgroundColor.value = '#1a1a1a'
  fontSize.value = '1em'
  textColor.value = '#ffffff'
  if (editorRef.value) {
    editorRef.value.innerHTML = contentHtml.value
  }
}
</script>

<style scoped>
/* Normalize font sizes in editor and preview for consistent line heights */
.custom-editor :deep(span[style*="font-size: 0.7em"]) {
  font-size: 0.7em !important;
  line-height: 1.8 !important;
}

.custom-editor :deep(span[style*="font-size: 1em"]) {
  font-size: 1em !important;
  line-height: 1.6 !important;
}

.custom-editor :deep(span[style*="font-size: 1.5em"]) {
  font-size: 1.5em !important;
  line-height: 1.4 !important;
}

.custom-editor :deep(span[style*="font-size: 2em"]) {
  font-size: 2em !important;
  line-height: 1.3 !important;
}

.custom-preview :deep(span[style*="font-size: 0.7em"]) {
  font-size: 0.7em !important;
  line-height: 1.8 !important;
}

.custom-preview :deep(span[style*="font-size: 1em"]) {
  font-size: 1em !important;
  line-height: 1.6 !important;
}

.custom-preview :deep(span[style*="font-size: 1.5em"]) {
  font-size: 1.5em !important;
  line-height: 1.4 !important;
}

.custom-preview :deep(span[style*="font-size: 2em"]) {
  font-size: 2em !important;
  line-height: 1.3 !important;
}
</style>
