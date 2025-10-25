<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-gold-500">Create New Library</h2>
        <button
          @click="$emit('close')"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">
            Library Name
          </label>
          <input
            ref="nameInputRef"
            v-model="libraryName"
            type="text"
            placeholder="e.g., MyChurch"
            class="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            @keyup.enter="handleCreate"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">
            Save Location
          </label>
          <div class="flex gap-2">
            <input
              v-model="selectedPath"
              type="text"
              readonly
              placeholder="Click Browse to select..."
              class="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 cursor-not-allowed"
            />
            <button
              @click="browseFolderLocation"
              class="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Browse
            </button>
          </div>
          <p class="mt-2 text-xs text-neutral-500">
            Library will be created as: {{ previewPath }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleCreate"
          :disabled="!canCreate"
          class="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Library
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'create'])

const nameInputRef = ref(null)
const libraryName = ref('MyChurch')
const selectedPath = ref('')

const canCreate = computed(() => {
  return libraryName.value.trim() !== '' && selectedPath.value !== ''
})

const previewPath = computed(() => {
  if (!selectedPath.value || !libraryName.value) return ''
  return `${selectedPath.value}/${libraryName.value}.dclib`
})

async function browseFolderLocation() {
  if (!window.electronAPI) return

  const result = await window.electronAPI.selectLibraryFolder()
  if (result.success) {
    selectedPath.value = result.path
  }
}

function handleCreate() {
  if (!canCreate.value) return

  emit('create', {
    name: libraryName.value.trim(),
    path: selectedPath.value
  })

  // Reset form
  libraryName.value = 'MyChurch'
  selectedPath.value = ''
}

// Focus input when dialog opens
watch(() => props.show, (isShown) => {
  if (isShown) {
    nextTick(() => {
      nameInputRef.value?.focus()
    })
  }
})
</script>
