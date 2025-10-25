<template>
  <Modal :show="show" :title="title" @close="handleCancel">
    <div class="space-y-4">
      <p v-if="message" class="text-sm text-neutral-300">{{ message }}</p>

      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        @keyup.enter="handleConfirm"
        @keyup.esc="handleCancel"
        class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
      />

      <div class="flex gap-3 justify-end pt-2">
        <button
          @click="handleCancel"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold text-neutral-200 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          :disabled="!inputValue.trim()"
          class="px-4 py-2 bg-gold-500 hover:bg-gold-400 rounded-lg font-semibold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          OK
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Input'
  },
  message: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  defaultValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const inputRef = ref(null)
const inputValue = ref('')

// Reset and focus input when dialog opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    inputValue.value = props.defaultValue
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        inputRef.value.select()
      }
    })
  }
})

function handleConfirm() {
  if (inputValue.value.trim()) {
    emit('confirm', inputValue.value.trim())
    inputValue.value = ''
  }
}

function handleCancel() {
  emit('cancel')
  emit('close')
  inputValue.value = ''
}
</script>
