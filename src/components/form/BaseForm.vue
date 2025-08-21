<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <slot />
  </form>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'submit', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const handleSubmit = (event: Event) => {
  if (!props.disabled) {
    emit('submit', event)
  }
}
</script> 