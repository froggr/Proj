<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
            <h2 class="text-lg font-semibold text-gold-500">{{ title }}</h2>
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
          <div class="flex-1 overflow-y-auto p-6">
            <slot></slot>
          </div>

          <!-- Footer (optional) -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 flex-shrink-0">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String
})

defineEmits(['close'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-neutral-900,
.modal-leave-active .bg-neutral-900 {
  transition: transform 0.2s ease;
}

.modal-enter-from .bg-neutral-900,
.modal-leave-to .bg-neutral-900 {
  transform: scale(0.95);
}
</style>
