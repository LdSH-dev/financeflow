<template>
  <BaseField
    v-model="passwordValue"
    id="password"
    label="Password"
    :type="showPassword ? 'text' : 'password'"
    autocomplete="current-password"
    required
    placeholder="Enter your password"
    :error-message="errorMessage"
    show-toggle
    @update:model-value="handlePasswordChange"
  >
    <template #suffix>
      <button
        type="button"
        @click="showPassword = !showPassword"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
        <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
      </button>
    </template>
  </BaseField>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import BaseField from './BaseField.vue'

interface Props {
  modelValue: string
  errorMessage?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showPassword = ref(false)

const passwordValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

const handlePasswordChange = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<script lang="ts">
import { computed } from 'vue'
</script> 