<template>
  <Modal :show="show" :title="isNewSong ? 'Create New Song' : 'Edit Song'" @close="$emit('close')" size="full">
    <div class="grid grid-cols-2 gap-6 h-[85vh]">
      <!-- Left: Text Editor -->
      <div class="flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-neutral-300">ChordPro / OnSong Format</label>
          <button
            @click="showFormatHelp = !showFormatHelp"
            class="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 transition-colors"
          >
            {{ showFormatHelp ? 'Hide' : 'Show' }} Format Help
          </button>
        </div>

        <!-- Format Help -->
        <div v-if="showFormatHelp" class="mb-3 p-3 bg-neutral-900 rounded-lg text-xs text-neutral-400 space-y-1">
          <p><span class="text-gold-500 font-mono">Title:</span> Song Title</p>
          <p><span class="text-gold-500 font-mono">Artist:</span> Artist Name</p>
          <p><span class="text-gold-500 font-mono">[Verse]</span> Section markers</p>
          <p><span class="text-gold-500 font-mono">[C]</span>Amazing Chords in brackets above lyrics</p>
        </div>

        <!-- Textarea with syntax hints -->
        <div class="flex-1 relative">
          <textarea
            v-model="songContent"
            class="w-full h-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 text-sm font-mono resize-none focus:outline-none focus:border-gold-500"
            :class="{ 'border-red-500': hasError }"
            placeholder="Title: Amazing Grace&#10;Artist: John Newton&#10;&#10;[Verse 1]&#10;[C]Amazing [F]Grace, how [C]sweet the [G]sound&#10;That [C]saved a [F]wretch like [C]me&#10;&#10;[Chorus]&#10;[C]Grace, [F]grace, [C]God's [G]grace&#10;[C]Grace that will [F]pardon and [C]cleanse within"
            spellcheck="false"
            @input="handleInput"
          ></textarea>

          <!-- Syntax highlighting overlay (visual hints only) -->
          <div class="absolute top-2 right-2 flex gap-1">
            <div
              v-if="detectedSections.length > 0"
              class="px-2 py-1 bg-green-600/20 border border-green-600/40 rounded text-xs text-green-400"
              :title="`Found ${detectedSections.length} sections`"
            >
              {{ detectedSections.length }} sections
            </div>
            <div
              v-if="detectedChords.length > 0"
              class="px-2 py-1 bg-blue-600/20 border border-blue-600/40 rounded text-xs text-blue-400"
              :title="`Found ${detectedChords.length} chords`"
            >
              {{ detectedChords.length }} chords
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="hasError" class="mt-2 text-xs text-red-500">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Right: Live Preview -->
      <div class="flex flex-col bg-neutral-900 rounded-lg p-4 overflow-y-auto">
        <h3 class="text-sm font-medium text-neutral-300 mb-3">Preview</h3>

        <!-- Parsed song info -->
        <div v-if="parsedSong" class="space-y-4">
          <div class="pb-3 border-b border-neutral-800">
            <h4 class="text-lg font-semibold text-white">{{ parsedSong.title || 'Untitled' }}</h4>
            <p class="text-sm text-neutral-400">{{ parsedSong.artist || 'Unknown Artist' }}</p>
          </div>

          <!-- Sections -->
          <div v-if="parsedSong.processed_sections && parsedSong.processed_sections.length > 0" class="space-y-3">
            <div
              v-for="(section, index) in parsedSong.processed_sections"
              :key="index"
              class="p-3 bg-neutral-800 rounded-lg"
            >
              <div class="text-xs font-semibold text-gold-500 mb-2">{{ section.title }}</div>
              <div class="space-y-1">
                <div
                  v-for="(line, lineIndex) in section.lines"
                  :key="lineIndex"
                  class="text-sm text-neutral-300 font-mono"
                >
                  <span v-for="(pair, pairIndex) in line" :key="pairIndex">
                    <span v-if="pair[0]" class="text-blue-400">{{ pair[0] }}</span>
                    <span>{{ pair[1] }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-sm text-neutral-500 italic">
            No sections found. Add section markers like [Verse], [Chorus], etc.
          </div>
        </div>

        <div v-else class="text-sm text-neutral-500 italic">
          Start typing to see preview...
        </div>
      </div>
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-2">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          :disabled="!canSave"
          class="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isNewSong ? 'Create Song' : 'Save Changes' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'
import { parseChordPro } from '@/parsers/ChordProParser'
import { parseOnSong } from '@/parsers/OnSongParser'

const props = defineProps({
  show: Boolean,
  song: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const songContent = ref('')
const showFormatHelp = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// Computed properties
const isNewSong = computed(() => !props.song)

const parsedSong = computed(() => {
  if (!songContent.value || songContent.value.trim() === '') {
    return null
  }

  try {
    hasError.value = false
    errorMessage.value = ''
    // Use OnSong parser (supports Title:/Artist: metadata and [Section] markers)
    return parseOnSong(songContent.value, 'New Song')
  } catch (error) {
    hasError.value = true
    errorMessage.value = error.message
    return null
  }
})

const detectedSections = computed(() => {
  if (!songContent.value) return []
  const matches = songContent.value.match(/^\[([^\]]+)\]/gm) || []
  return matches.filter(m => !m.match(/\[[A-G#b]/)) // Exclude chords
})

const detectedChords = computed(() => {
  if (!songContent.value) return []
  const matches = songContent.value.match(/\[[A-G#b][^\]]*\]/g) || []
  return [...new Set(matches)] // Unique chords only
})

const canSave = computed(() => {
  return parsedSong.value && parsedSong.value.title && !hasError.value
})

// Watch for song prop changes (when editing existing song)
watch(() => props.song, (newSong) => {
  if (newSong && newSong.rawContent) {
    songContent.value = newSong.rawContent
  } else if (newSong) {
    // Reconstruct from parsed data if rawContent not available
    songContent.value = reconstructSongContent(newSong)
  } else {
    // New song - clear
    songContent.value = ''
  }
}, { immediate: true })

function handleInput() {
  // Real-time validation happens via computed properties
}

function handleSave() {
  if (!canSave.value) return

  const songData = {
    ...parsedSong.value,
    rawContent: songContent.value
  }

  emit('save', songData)
}

function reconstructSongContent(song) {
  let content = ''

  // Metadata
  if (song.title) content += `Title: ${song.title}\n`
  if (song.artist) content += `Artist: ${song.artist}\n`
  content += '\n'

  // Sections
  if (song.processed_sections) {
    song.processed_sections.forEach(section => {
      content += `[${section.title}]\n`
      if (section.lines) {
        section.lines.forEach(line => {
          // Reconstruct chord/lyric pairs
          line.forEach(pair => {
            if (pair[0]) content += `[${pair[0]}]`
            content += pair[1]
          })
          content += '\n'
        })
      }
      content += '\n'
    })
  }

  return content
}
</script>
