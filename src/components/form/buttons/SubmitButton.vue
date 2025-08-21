<template>
  <BaseButton
    type="submit"
    variant="primary"
    :disabled="disabled || isLoading"
    full-width
    @click="handleClick"
  >
    <div v-if="isLoading" class="spinner w-4 h-4 border-white mr-2"></div>
    <span>{{ isLoading ? loadingText : text }}</span>
  </BaseButton>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  loadingText?: string
  disabled?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  text: 'Submit',
  loadingText: 'Loading...',
  disabled: false,
  isLoading: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<script lang="ts">
import BaseButton from './BaseButton.vue'
</script>

<style scoped>
.spinner {
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 