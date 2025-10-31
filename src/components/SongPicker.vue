<template>
  <Modal :show="show" title="Add Song" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Song Library -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-neutral-300">Select Song</label>
          <button
            @click="handleImportSongs"
            class="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-300"
          >
            📁 Import Songs
          </button>
        </div>

        <!-- Song List -->
        <div v-if="songs.length > 0" class="max-h-64 overflow-y-auto space-y-2 bg-neutral-900/50 rounded-lg p-2">
          <button
            v-for="song in songs"
            :key="song.id"
            @click="selectedSong = song"
            class="w-full text-left px-3 py-2 rounded-lg transition-all"
            :class="{
              'bg-gold-500 text-black': selectedSong?.id === song.id,
              'bg-neutral-800 hover:bg-neutral-700 text-neutral-200': selectedSong?.id !== song.id
            }"
          >
            <div class="font-medium text-sm">{{ song.title }}</div>
            <div class="text-xs opacity-70">{{ song.artist }}</div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-neutral-500 bg-neutral-900/50 rounded-lg">
          <div class="text-4xl mb-2">🎵</div>
          <p class="text-sm">No songs in library</p>
          <p class="text-xs mt-1">Import OnSong or ChordPro files</p>
        </div>
      </div>

      <!-- Song Settings (when song selected) -->
      <div v-if="selectedSong" class="space-y-4">
        <!-- Background Settings -->
        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">Background</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
              <input
                type="radio"
                v-model="backgroundMode"
                value="none"
                class="text-gold-500"
              />
              <span class="text-sm text-neutral-200">None (Black)</span>
            </label>
            <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
              <input
                type="radio"
                v-model="backgroundMode"
                value="single"
                class="text-gold-500"
              />
              <span class="text-sm text-neutral-200">Single Video</span>
            </label>
          </div>

          <!-- Video Picker (if single mode) -->
          <div v-if="backgroundMode === 'single'" class="mt-2">
            <button
              @click="selectBackgroundVideo"
              class="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-200"
            >
              {{ backgroundVideo ? '✓ Video Selected' : 'Choose Video' }}
            </button>
            <!-- Background Opacity -->
            <div v-if="backgroundVideo" class="mt-2">
              <label class="block text-sm text-neutral-400 mb-1">
                Opacity: {{ Math.round(backgroundOpacity * 100) }}%
              </label>
              <input
                type="range"
                v-model.number="backgroundOpacity"
                min="0.1"
                max="1"
                step="0.1"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Font Family -->
        <FontPicker
          v-model="fontFamily"
          label="Font"
          @preview="handleFontPreview"
        />

        <!-- Font Weight -->
        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">Weight</label>
          <select
            v-model.number="fontWeight"
            class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm"
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
          <label class="block text-sm font-medium text-neutral-300 mb-2">Color</label>
          <select
            v-model="fontColor"
            class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm"
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
              v-model="textShadow"
              class="w-4 h-4 text-gold-500 bg-neutral-800 border-neutral-700 rounded"
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
            v-model.number="linesPerSection"
            min="2"
            max="12"
            class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm"
          />
        </div>

        <!-- Full Preview -->
        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">Preview</label>
          <div class="relative aspect-video bg-black rounded-lg overflow-hidden">
            <!-- Background Video Preview -->
            <video
              v-if="backgroundMode === 'single' && backgroundVideo && resolvedVideoUrl"
              :src="resolvedVideoUrl"
              autoplay
              muted
              loop
              playsinline
              class="absolute inset-0 w-full h-full object-cover"
              :style="{ opacity: backgroundOpacity }"
            />

            <!-- Lyrics Preview -->
            <div class="absolute inset-0 flex items-center justify-center p-6">
              <div
                class="text-center"
                :style="{
                  fontFamily: previewFont || fontFamily,
                  fontWeight: fontWeight,
                  color: fontColor === 'dark' ? '#000000' : '#ffffff',
                  textShadow: textShadow
                    ? (fontColor === 'dark'
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
          @click="handleAdd"
          :disabled="!selectedSong"
          class="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Song
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import FontPicker from './FontPicker.vue'
import { useSongLibrary } from '@/library/SongLibrary'
import { resolveAssetUrl } from '@/utils/assetResolver'

const props = defineProps({
  show: Boolean,
  songs: {
    type: Array,
    default: () => []
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'add', 'import-songs', 'select-video'])

const { browseSongFiles, importSongFiles } = useSongLibrary()

const selectedSong = ref(null)
const backgroundMode = ref('none')
const backgroundVideo = ref(null)
const backgroundOpacity = ref(0.4)
const fontFamily = ref('system-ui, -apple-system, sans-serif')
const fontWeight = ref(600)
const fontColor = ref('light')
const textShadow = ref(true)
const linesPerSection = ref(4)
const previewFont = ref(null) // Temporary font for keyboard preview

// Resolve video URL for preview (use ref + watch instead of async computed)
const resolvedVideoUrl = ref(null)

watch(() => [backgroundVideo.value, props.libraryRoot], async ([videoUrl, libRoot]) => {
  if (!videoUrl) {
    resolvedVideoUrl.value = null
    return
  }
  resolvedVideoUrl.value = await resolveAssetUrl(videoUrl, libRoot)
}, { immediate: true })

// Handle font preview (when user navigates with keyboard)
function handleFontPreview(font) {
  previewFont.value = font
}

async function handleImportSongs() {
  try {
    const result = await browseSongFiles()
    if (result.canceled || !result.files || result.files.length === 0) {
      return
    }

    await importSongFiles(result.files)
    emit('import-songs') // Tell parent to reload songs
  } catch (error) {
    console.error('Import error:', error)
  }
}

function selectBackgroundVideo() {
  emit('select-video', (videoUrl) => {
    backgroundVideo.value = videoUrl
  })
}

function handleAdd() {
  if (!selectedSong.value) return

  emit('add', {
    type: 'song',
    songId: selectedSong.value.id,
    title: selectedSong.value.title,
    backgroundMode: backgroundMode.value,
    backgroundVideo: backgroundVideo.value,
    backgroundOpacity: backgroundOpacity.value,
    fontFamily: fontFamily.value,
    fontWeight: fontWeight.value,
    fontColor: fontColor.value,
    textShadow: textShadow.value,
    linesPerSection: linesPerSection.value
  })

  // Reset
  selectedSong.value = null
  backgroundMode.value = 'none'
  backgroundVideo.value = null
  backgroundOpacity.value = 0.4
  fontFamily.value = 'system-ui, -apple-system, sans-serif'
  fontWeight.value = 600
  fontColor.value = 'light'
  textShadow.value = true
  linesPerSection.value = 4
}
</script>
