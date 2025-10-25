<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-xl font-semibold text-gold-500">Create Custom Slide</h2>
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
                @change="applyStyle"
                class="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-white text-xs"
              >
                <option value="1">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
                <option value="7">Huge</option>
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
              class="w-full min-h-[200px] px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-gold-500/50 overflow-auto"
              style="max-height: 300px;"
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
                v-html="contentHtml"
              ></div>
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
          Add Slide
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'add'])

const editorRef = ref(null)
const slideTitle = ref('')
const contentHtml = ref('<p style="text-align: center; font-size: 32px; color: white;">Type your content here...</p>')
const backgroundColor = ref('#1a1a1a')
const fontSize = ref('3')
const textColor = ref('#ffffff')

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = contentHtml.value
  }
})

function execCommand(command, value = null) {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
}

function applyStyle() {
  execCommand('fontSize', fontSize.value)
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
  contentHtml.value = '<p style="text-align: center; font-size: 32px; color: white;">Type your content here...</p>'
  backgroundColor.value = '#1a1a1a'
  fontSize.value = '3'
  textColor.value = '#ffffff'
  if (editorRef.value) {
    editorRef.value.innerHTML = contentHtml.value
  }
}
</script>
