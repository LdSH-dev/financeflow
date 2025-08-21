<template>
  <BaseField
    v-model="emailValue"
    id="email"
    label="Email address"
    type="email"
    autocomplete="email"
    required
    placeholder="Enter your email"
    :error-message="errorMessage"
    @update:model-value="handleEmailChange"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  errorMessage?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const emailValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const handleEmailChange = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<script lang="ts">
import { computed } from 'vue'
import BaseField from './BaseField.vue'
</script> 