<template>
  <BaseForm @submit="handleSubmit">
    <div class="space-y-4">
      <!-- Email Field -->
      <UserField
        v-model="form.email"
        :error-message="errors.email"
        @update:model-value="clearEmailError"
      />

      <!-- Password Field -->
      <PasswordField
        v-model="form.password"
        :error-message="errors.password"
        @update:model-value="clearPasswordError"
      />
    </div>

    <!-- Remember Me & Forgot Password -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <input
          id="remember-me"
          v-model="form.rememberMe"
          type="checkbox"
          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
          Remember me
        </label>
      </div>

      <div class="text-sm">
        <router-link 
          to="/forgot-password" 
          class="font-medium text-primary-600 hover:text-primary-500"
        >
          Forgot your password?
        </router-link>
      </div>
    </div>

    <!-- Submit Button -->
    <SubmitButton
      :is-loading="isLoading"
      text="Sign in"
      loading-text="Signing in..."
    />

    <!-- Error Message -->
    <ErrorMessage :message="loginError" />

    <!-- Demo Credentials -->
    <div v-if="isDevelopment" class="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
      <div class="flex">
        <InformationCircleIcon class="h-5 w-5 text-blue-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Demo Credentials
          </h3>
          <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p>Email: demo@financeflow.com</p>
            <p>Password: demo12345</p>
            <button
              type="button"
              @click="fillDemoCredentials"
              class="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
            >
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseForm>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import BaseForm from './BaseForm.vue'
import UserField from './fields/UserField.vue'
import PasswordField from './fields/PasswordField.vue'
import SubmitButton from './buttons/SubmitButton.vue'
import ErrorMessage from './ErrorMessage.vue'
import type { LoginRequest } from '@types/api'

interface Props {
  isLoading?: boolean
  loginError?: string
  isDevelopment?: boolean
}

interface Emits {
  (e: 'submit', formData: LoginRequest & { rememberMe: boolean }): void
  (e: 'fill-demo-credentials'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  loginError: '',
  isDevelopment: false
})

const emit = defineEmits<Emits>()

const form = reactive<LoginRequest & { rememberMe: boolean }>({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const handleSubmit = () => {
  emit('submit', { ...form })
}

const clearEmailError = () => {
  errors.email = ''
}

const clearPasswordError = () => {
  errors.password = ''
}

const fillDemoCredentials = () => {
  emit('fill-demo-credentials')
}

// Expose form and errors for parent component access
defineExpose({
  form,
  errors
})
</script> 