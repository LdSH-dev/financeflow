<template>
  <div>
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :id="id"
        :value="modelValue"
        :type="type"
        :autocomplete="autocomplete"
        :required="required"
        :placeholder="placeholder"
        :disabled="disabled"
        class="form-input"
        :class="[
          { 'border-red-500': hasError },
          { 'pr-10': showToggle },
          inputClass
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
      <slot name="suffix" />
    </div>
    <p v-if="errorMessage" class="form-error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  id?: string
  label?: string
  type?: string
  autocomplete?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  errorMessage?: string
  inputClass?: string
  showToggle?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  showToggle: false,
  inputClass: ''
})

const emit = defineEmits<Emits>()

const hasError = computed(() => !!props.errorMessage)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}
</script>

<script lang="ts">
import { computed } from 'vue'
</script> 