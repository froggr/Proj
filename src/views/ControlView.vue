<template>
  <div class="h-screen w-screen bg-neutral-950 flex flex-col">
    <!-- Top Bar -->
    <div class="px-6 py-3 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 backdrop-blur">
      <div class="flex items-center gap-6">
        <h1 class="text-xl font-bold text-gold-500">DongleControl Projector</h1>
        <div class="flex gap-2">
          <button
            @click="newPresentation"
            class="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-gold-500 hover:bg-neutral-800 rounded-lg transition-all"
          >
            New
          </button>
          <button
            @click="loadPresentation"
            class="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-gold-500 hover:bg-neutral-800 rounded-lg transition-all"
          >
            Load
          </button>
          <button
            @click="savePresentation"
            class="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-gold-500 hover:bg-neutral-800 rounded-lg transition-all"
          >
            Save
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Aspect Ratio Selector -->
        <select
          v-model="aspectRatio"
          class="px-3 py-1.5 text-xs border border-gold-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-medium hover:border-gold-500 transition-colors"
          style="background-color: #171717; color: white;"
        >
          <option value="16:9-720">720p (16:9)</option>
          <option value="16:9-1080">1080p (16:9)</option>
          <option value="16:9-4k">4K (16:9)</option>
        </select>

        <button
          @click="toggleProjector"
          class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all"
          :class="isProjectorOpen
            ? 'bg-gold-500 text-black hover:bg-gold-400'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'"
        >
          {{ isProjectorOpen ? '● Projector Active' : 'Open Projector' }}
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex p-4 gap-4 min-h-0 relative">
      <!-- Left Sidebar: Stacks -->
      <div class="w-56 bg-neutral-900/50 backdrop-blur rounded-xl border border-neutral-800 p-3 overflow-y-auto flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Stacks</h2>
          <button
            @click="addNewStack"
            class="p-1 bg-gold-500/10 hover:bg-gold-500/20 rounded-lg text-gold-500 transition-all"
            title="Add Stack"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <!-- Stacks List -->
        <div class="space-y-1 flex-1">
          <div
            v-for="(stack, stackIndex) in stacks"
            :key="stack.id"
            class="bg-neutral-800/50 rounded-lg overflow-hidden"
          >
            <!-- Stack Header -->
            <div
              class="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-700/50 transition-all"
              :class="stackIndex === stagedStackIndex ? 'bg-gold-500/10' : ''"
            >
              <svg
                class="w-3 h-3 text-neutral-500 transition-transform cursor-pointer"
                :class="expandedStacks[stackIndex] ? 'rotate-90' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                @click="toggleStack(stackIndex)"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="flex-1 text-neutral-200 font-medium text-xs truncate cursor-pointer" @click="toggleStack(stackIndex)">{{ stack.title }}</span>
              <span class="text-xs text-neutral-500">{{ stack.slides.length }}</span>
              <button
                @click.stop="openStackSettings(stackIndex)"
                class="p-0.5 hover:bg-neutral-600/50 rounded transition-colors"
                title="Stack Settings"
              >
                <svg class="w-3 h-3 text-neutral-400 hover:text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                v-if="stacks.length > 1"
                @click.stop="removeStackConfirm(stackIndex)"
                class="p-0.5 hover:bg-red-500/20 rounded transition-colors"
                title="Delete Stack"
              >
                <svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div v-if="stackIndex === liveStackIndex" class="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse"></div>
            </div>

            <!-- Slides in Stack -->
            <div v-if="expandedStacks[stackIndex]" class="px-2 pb-2 space-y-0.5">
              <div
                v-for="(slide, slideIndex) in stack.slides"
                :key="slideIndex"
                class="flex items-center gap-2 px-2 py-1 rounded-md transition-all text-xs group"
                :class="[
                  stackIndex === stagedStackIndex && slideIndex === stagedSlideIndex
                    ? 'bg-gold-500/20 text-gold-300'
                    : 'text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-200'
                ]"
              >
                <span class="text-[10px] text-neutral-600 w-4">{{ slideIndex + 1 }}</span>
                <span class="flex-1 truncate cursor-pointer" @click="stageSlideInStack(stackIndex, slideIndex)">{{ slide.title || getSlideTypeName(slide.type) }}</span>
                <span class="text-[10px]">{{ getSlideTypeIcon(slide.type) }}</span>
                <button
                  @click.stop="removeSlide(stackIndex, slideIndex)"
                  class="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
                  title="Delete slide"
                >
                  <svg class="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Add Slide Button -->
              <button
                @click="openAddSlideMenu(stackIndex)"
                class="w-full px-2 py-1 text-[10px] text-neutral-500 hover:text-gold-500 hover:bg-neutral-700/30 rounded-md transition-all"
              >
                + Add Slide
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Large Staged Preview with Aspect Ratio -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Compact Controls -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <button
              @click="prevSlide"
              :disabled="!canGoPrevSlide"
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
              :class="canGoPrevSlide
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'"
            >
              ← Prev
            </button>

            <button
              @click="goLive"
              class="px-6 py-1.5 text-sm font-bold bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
            >
              GO LIVE
            </button>

            <button
              @click="nextSlide"
              :disabled="!canGoNextSlide"
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
              :class="canGoNextSlide
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'"
            >
              Next →
            </button>

            <button
              @click="clearProjection"
              class="ml-4 px-3 py-1.5 text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-all"
            >
              Clear
            </button>
          </div>

          <div class="text-[10px] text-neutral-600 uppercase tracking-wider">
            Stack {{ stagedStackIndex + 1 }} • Slide {{ stagedSlideIndex + 1 }}
          </div>
        </div>

        <!-- Aspect Ratio Container -->
        <div class="flex-1 flex items-center justify-center bg-neutral-900/30 rounded-xl border border-neutral-800 p-8">
          <div
            class="relative bg-black rounded-lg overflow-hidden shadow-2xl"
            :style="previewStyle"
          >
            <!-- Gold staging border -->
            <div class="absolute inset-0 border-4 border-gold-500 rounded-lg pointer-events-none shadow-lg shadow-gold-500/50"></div>
            <SlidePreview
              :slide="currentSlide"
              :isStaged="true"
              :transitionType="currentStack?.autoAdvance?.transition || 'none'"
              @video-ended="onVideoComplete"
              @youtube-ended="onVideoComplete"
            />
          </div>
        </div>
      </div>

      <!-- Top Right: Tiny PiP -->
      <div class="absolute top-4 right-4 w-48 bg-neutral-900/90 backdrop-blur-xl rounded-lg border border-neutral-800 p-2 shadow-2xl">
        <div class="flex items-center justify-between mb-1.5">
          <h3 class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Live</h3>
          <div v-if="liveSlide" class="flex items-center gap-1">
            <div class="w-1 h-1 bg-gold-500 rounded-full animate-pulse"></div>
            <span class="text-[9px] text-gold-500 font-medium">ON AIR</span>
          </div>
          <div v-else class="text-[9px] text-neutral-600">Idle</div>
        </div>
        <div class="aspect-video bg-black rounded border border-neutral-700 overflow-hidden">
          <SlidePreview
            :slide="liveSlide"
            :scale="0.2"
            :transitionType="liveStack?.autoAdvance?.transition || 'none'"
            @video-ended="onVideoComplete"
            @youtube-ended="onVideoComplete"
          />
        </div>
      </div>
    </div>

    <!-- Bottom: Compact Slide Strip -->
    <div class="bg-neutral-900/50 backdrop-blur border-t border-neutral-800 px-4 py-2">
      <div class="flex items-center gap-2">
        <button
          @click="prevSlide"
          :disabled="!canGoPrevSlide"
          class="p-1 rounded transition-all disabled:opacity-20"
          :class="canGoPrevSlide ? 'text-neutral-400 hover:text-gold-500 hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1 overflow-x-auto">
          <div class="flex gap-2">
            <div
              v-for="(slide, index) in currentStack?.slides || []"
              :key="index"
              @click="selectSlide(index)"
              class="flex-shrink-0 w-24 h-14 rounded-lg cursor-pointer transition-all border overflow-hidden"
              :class="[
                index === stagedSlideIndex
                  ? 'border-gold-500 ring-2 ring-gold-500/30 shadow-lg shadow-gold-500/20'
                  : 'border-neutral-700 hover:border-neutral-600',
                index === liveSlideIndex && liveStackIndex === stagedStackIndex
                  ? 'ring-2 ring-gold-500/50'
                  : ''
              ]"
            >
              <div class="w-full h-full bg-black relative">
                <SlidePreview :slide="slide" :scale="0.1" />
                <div class="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/80 text-[9px] text-neutral-400 font-medium rounded">
                  {{ index + 1 }}
                </div>
                <div v-if="index === liveSlideIndex && liveStackIndex === stagedStackIndex" class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="nextSlide"
          :disabled="!canGoNextSlide"
          class="p-1 rounded transition-all disabled:opacity-20"
          :class="canGoNextSlide ? 'text-neutral-400 hover:text-gold-500 hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div v-if="currentStack" class="mt-1 text-center text-[10px] text-neutral-600">
        {{ currentStack.title }} • {{ currentStack.slides.length }} slide{{ currentStack.slides.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Add Slide Menu -->
    <div
      v-if="showAddSlideMenu"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      @click="showAddSlideMenu = false"
    >
      <div
        class="absolute bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 min-w-[160px]"
        :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
        @click.stop
      >
        <button
          @click="openCustomDialog"
          class="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-2 text-xs"
        >
          <span class="text-gold-500">✏️</span>
          Custom
        </button>
        <button
          @click="openBibleDialog"
          class="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-2 text-xs"
        >
          <span class="text-blue-400">📖</span>
          Bible
        </button>
        <button
          @click="openYouTubeDialog"
          class="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-2 text-xs"
        >
          <span class="text-red-400">📺</span>
          YouTube
        </button>
        <button
          @click="openImageDialog"
          class="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-2 text-xs"
        >
          <span class="text-green-400">🖼️</span>
          Image
        </button>
        <button
          @click="openVideoDialog"
          class="w-full px-3 py-2 text-left text-neutral-200 hover:bg-neutral-800 rounded-lg transition-all flex items-center gap-2 text-xs"
        >
          <span class="text-orange-400">🎬</span>
          Video
        </button>
      </div>
    </div>

    <!-- Dialogs -->
    <CustomSlideEditor
      :show="showCustomDialog"
      @close="showCustomDialog = false"
      @add="handleAddSlide"
    />
    <AddBibleSlide
      :show="showBibleDialog"
      @close="showBibleDialog = false"
      @add="handleAddSlide"
    />
    <AddYouTubeSlide
      :show="showYouTubeDialog"
      @close="showYouTubeDialog = false"
      @add="handleAddSlide"
    />
    <AddImageSlide
      :show="showImageDialog"
      @close="showImageDialog = false"
      @add="handleAddSlide"
    />
    <AddLocalVideoSlide
      :show="showVideoDialog"
      @close="showVideoDialog = false"
      @add="handleAddSlide"
    />

    <!-- Stack Settings Dialog -->
    <Modal :show="showStackSettings" title="Stack Auto-Advance Settings" @close="showStackSettings = false">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <input
            v-model="stackSettingsForm.enabled"
            type="checkbox"
            id="autoAdvanceEnabled"
            class="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-neutral-900"
          />
          <label for="autoAdvanceEnabled" class="text-sm font-medium text-neutral-200">
            Enable Auto-Advance
          </label>
        </div>

        <div v-if="stackSettingsForm.enabled" class="space-y-4 pl-7">
          <div>
            <label class="block text-sm font-medium text-neutral-300 mb-2">
              Advance Type
            </label>
            <select
              v-model="stackSettingsForm.type"
              class="w-full px-4 py-2 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              style="background-color: #171717; color: white;"
            >
              <option value="manual">Manual (No Auto-Advance)</option>
              <option value="timer">Timer (Fixed Interval)</option>
              <option value="video-end">Video End (Advance After Video)</option>
              <option value="youtube-end">YouTube End (Advance After YouTube)</option>
            </select>
            <p class="mt-2 text-xs text-neutral-400">YouTube auto-advance: video will fade to black on completion</p>
          </div>

          <div v-if="stackSettingsForm.type === 'timer'">
            <label class="block text-sm font-medium text-neutral-300 mb-2">
              Delay (seconds)
            </label>
            <input
              :value="Math.round(stackSettingsForm.delay / 1000)"
              @input="stackSettingsForm.delay = $event.target.value * 1000"
              type="number"
              min="1"
              max="300"
              step="1"
              class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <p class="mt-1 text-xs text-neutral-400">Time between slide advances</p>
          </div>

          <div class="flex items-center gap-3">
            <input
              v-model="stackSettingsForm.repeat"
              type="checkbox"
              id="autoAdvanceRepeat"
              class="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-neutral-900"
            />
            <label for="autoAdvanceRepeat" class="text-sm text-neutral-300">
              Repeat (Loop back to first slide)
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-300 mb-2">
              Slide Transition Effect
            </label>
            <select
              v-model="stackSettingsForm.transition"
              class="w-full px-4 py-2 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              style="background-color: #171717; color: white;"
            >
              <option value="instant">Instant</option>
              <option value="fade">Fade (500ms)</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button
            @click="showStackSettings = false"
            class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveStackSettings"
            class="px-4 py-2 bg-gold-500 hover:bg-gold-400 rounded-lg font-semibold text-black transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>

    <!-- Input Dialog for New Stack -->
    <InputDialog
      :show="showInputDialog"
      title="New Stack"
      message="Enter a title for the new stack:"
      placeholder="New Stack"
      defaultValue="New Stack"
      @confirm="handleNewStackConfirm"
      @cancel="handleNewStackCancel"
      @close="handleNewStackCancel"
    />

    <!-- Monitor Selection Dialog -->
    <Modal :show="showMonitorDialog" title="Select Projector Display" @close="showMonitorDialog = false">
      <div class="space-y-4">
        <p class="text-sm text-neutral-300">
          Choose which display to use for the projector output:
        </p>

        <div class="space-y-2">
          <div
            v-for="(monitor, index) in availableMonitors"
            :key="index"
            class="flex items-center p-3 bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
            :class="{ 'ring-2 ring-gold-500': selectedMonitor === index }"
            @click="selectedMonitor = index"
          >
            <input
              type="radio"
              :value="index"
              v-model="selectedMonitor"
              class="mr-3"
            />
            <span class="text-neutral-200">{{ monitor }}</span>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button
            @click="showMonitorDialog = false"
            class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="openProjectorOnMonitor"
            class="px-4 py-2 bg-gold-500 hover:bg-gold-400 rounded-lg font-semibold text-black transition-colors"
          >
            Open Projector
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { usePresentation } from '../composables/usePresentation'
import { useKeyboard } from '../composables/useKeyboard'
import { useProjector } from '../composables/useProjector'
import SlidePreview from '../components/SlidePreview.vue'
import Modal from '../components/Modal.vue'
import CustomSlideEditor from '../components/CustomSlideEditor.vue'
import AddBibleSlide from '../components/AddBibleSlide.vue'
import AddYouTubeSlide from '../components/AddYouTubeSlide.vue'
import AddImageSlide from '../components/AddImageSlide.vue'
import AddLocalVideoSlide from '../components/AddLocalVideoSlide.vue'
import InputDialog from '../components/InputDialog.vue'

const {
  stacks,
  currentStack,
  currentSlide,
  liveSlide,
  stagedStackIndex,
  stagedSlideIndex,
  liveStackIndex,
  liveSlideIndex,
  canGoPrevSlide,
  canGoNextSlide,
  goLive,
  nextSlide,
  prevSlide,
  clearProjection,
  stageStack,
  stageSlideInStack,
  addStack,
  removeStack,
  addSlideToStack,
  removeSlideFromStack,
  updateStackSettings,
  onVideoComplete,
  savePresentation: savePresentationData,
  loadPresentation: loadPresentationData
} = usePresentation()

const {
  isProjectorOpen,
  getAvailableMonitors,
  openProjector,
  closeProjector
} = useProjector()

const aspectRatio = ref('16:9-1080')
const expandedStacks = reactive({})
const showCustomDialog = ref(false)
const showBibleDialog = ref(false)
const showYouTubeDialog = ref(false)
const showImageDialog = ref(false)
const showVideoDialog = ref(false)
const showMonitorDialog = ref(false)
const showAddSlideMenu = ref(false)
const showStackSettings = ref(false)
const showInputDialog = ref(false)
const availableMonitors = ref([])
const selectedMonitor = ref(0)
const currentStackForAdd = ref(null)
const currentStackForSettings = ref(null)
const menuPosition = reactive({ x: 0, y: 0 })

// Stack settings form
const stackSettingsForm = reactive({
  enabled: false,
  type: 'manual',
  delay: 5000,
  repeat: false,
  transition: 'fade'
})

// Aspect ratio dimensions - scaled to fit without scrolling
const previewStyle = computed(() => {
  const ratios = {
    '16:9-720': { width: 800, height: 450 },   // 720p scaled down
    '16:9-1080': { width: 960, height: 540 },  // 1080p scaled down
    '16:9-4k': { width: 960, height: 540 }     // 4K scaled down to same as 1080p
  }
  const dimensions = ratios[aspectRatio.value] || ratios['16:9-1080']
  return {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    aspectRatio: '16/9'
  }
})

// Initialize expanded stacks
stacks.value.forEach((_, index) => {
  expandedStacks[index] = true
})

function toggleStack(stackIndex) {
  expandedStacks[stackIndex] = !expandedStacks[stackIndex]
  stageStack(stackIndex)
}

function addNewStack() {
  console.log('addNewStack called!')
  showInputDialog.value = true
}

function handleNewStackConfirm(title) {
  console.log('Stack title entered:', title)
  if (title) {
    addStack(title)
    console.log('Stack added')
  }
  showInputDialog.value = false
}

function handleNewStackCancel() {
  showInputDialog.value = false
}

function openAddSlideMenu(stackIndex) {
  currentStackForAdd.value = stackIndex
  menuPosition.x = 280
  menuPosition.y = 200
  showAddSlideMenu.value = true
}

function openCustomDialog() {
  showAddSlideMenu.value = false
  showCustomDialog.value = true
}

function openBibleDialog() {
  showAddSlideMenu.value = false
  showBibleDialog.value = true
}

function openYouTubeDialog() {
  showAddSlideMenu.value = false
  showYouTubeDialog.value = true
}

function openImageDialog() {
  showAddSlideMenu.value = false
  showImageDialog.value = true
}

function openVideoDialog() {
  showAddSlideMenu.value = false
  showVideoDialog.value = true
}

function handleAddSlide(slide) {
  if (currentStackForAdd.value !== null) {
    addSlideToStack(currentStackForAdd.value, slide)
  }
  showCustomDialog.value = false
  showBibleDialog.value = false
  showYouTubeDialog.value = false
  showImageDialog.value = false
  showVideoDialog.value = false
}

function selectSlide(slideIndex) {
  stageSlideInStack(stagedStackIndex.value, slideIndex)
}

function openStackSettings(stackIndex) {
  currentStackForSettings.value = stackIndex
  const stack = stacks.value[stackIndex]
  if (stack) {
    stackSettingsForm.enabled = stack.autoAdvance.enabled
    stackSettingsForm.type = stack.autoAdvance.type
    stackSettingsForm.delay = stack.autoAdvance.delay
    stackSettingsForm.repeat = stack.autoAdvance.repeat
    stackSettingsForm.transition = stack.autoAdvance.transition || 'fade'
  }
  showStackSettings.value = true
}

function saveStackSettings() {
  if (currentStackForSettings.value !== null) {
    updateStackSettings(currentStackForSettings.value, {
      enabled: stackSettingsForm.enabled,
      type: stackSettingsForm.type,
      delay: stackSettingsForm.delay,
      repeat: stackSettingsForm.repeat,
      transition: stackSettingsForm.transition
    })
  }
  showStackSettings.value = false
  currentStackForSettings.value = null
}

function removeSlide(stackIndex, slideIndex) {
  if (confirm('Delete this slide?')) {
    removeSlideFromStack(stackIndex, slideIndex)
  }
}

function removeStackConfirm(stackIndex) {
  if (confirm(`Delete stack "${stacks.value[stackIndex].title}"?`)) {
    removeStack(stackIndex)
  }
}

function getSlideTypeName(type) {
  const names = {
    custom: 'Custom',
    bible: 'Bible',
    youtube: 'YouTube',
    image: 'Image',
    video: 'Video'
  }
  return names[type] || type
}

function getSlideTypeIcon(type) {
  const icons = {
    custom: '✏️',
    bible: '📖',
    youtube: '📺',
    image: '🖼️',
    video: '🎬'
  }
  return icons[type] || '📄'
}

async function toggleProjector() {
  console.log('ControlView: toggleProjector called, isProjectorOpen:', isProjectorOpen.value)
  if (isProjectorOpen.value) {
    closeProjector()
  } else {
    console.log('ControlView: Getting available monitors...')
    availableMonitors.value = await getAvailableMonitors()
    console.log('ControlView: Available monitors:', availableMonitors.value)
    if (availableMonitors.value.length > 1) {
      console.log('ControlView: Multiple monitors detected, showing dialog')
      showMonitorDialog.value = true
    } else {
      console.log('ControlView: Single or no monitors, opening on default')
      openProjector(0)
    }
  }
}

async function openProjectorOnMonitor() {
  showMonitorDialog.value = false
  await openProjector(selectedMonitor.value)
}

async function newPresentation() {
  if (confirm('Create a new presentation? This will clear all current stacks.')) {
    stacks.value = []
    addStack('Welcome')
  }
}

async function savePresentation() {
  try {
    if (!window.electronAPI) {
      alert('File operations not available')
      return
    }

    const data = savePresentationData()
    const result = await window.electronAPI.savePresentation(data)

    if (result.success) {
      alert('Presentation saved successfully!')
    } else if (!result.canceled) {
      alert('Failed to save presentation: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Failed to save presentation:', error)
    alert('Failed to save presentation: ' + error.message)
  }
}

async function loadPresentation() {
  try {
    if (!window.electronAPI) {
      alert('File operations not available')
      return
    }

    const result = await window.electronAPI.loadPresentation()

    if (result.success) {
      loadPresentationData(result.data)
      alert('Presentation loaded successfully!')
    } else if (!result.canceled) {
      alert('Failed to load presentation: ' + (result.error || 'Unknown error'))
    }
  } catch (error) {
    console.error('Failed to load presentation:', error)
    alert('Failed to load presentation: ' + error.message)
  }
}

useKeyboard({
  onSpace: goLive,
  onArrowLeft: prevSlide,
  onArrowRight: nextSlide,
  onEscape: clearProjection
})

// Listen for video completion events from projector window
onMounted(() => {
  if (window.electronAPI && window.electronAPI.onVideoEnded) {
    console.log('ControlView: Setting up video-ended listener')
    window.electronAPI.onVideoEnded(() => {
      console.log('ControlView: Received video-ended notification from projector')
      onVideoComplete()
    })
  } else {
    console.log('ControlView: onVideoEnded not available (preload script may need rebuild)')
  }
})
</script>

<style>
/* All selects - dark background with white text - GLOBAL to work in modals too */
select {
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  background-color: #171717 !important;
  color: #ffffff !important;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
  background-repeat: no-repeat !important;
  background-position: right 0.5rem center !important;
  background-size: 1em !important;
  padding-right: 2.5rem !important;
}

select option {
  background-color: #0a0a0a !important;
  color: #ffffff !important;
}
</style>
