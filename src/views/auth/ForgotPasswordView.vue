<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Forgot your password?
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label for="email" class="form-label">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="form-input"
            :class="{ 'border-red-500': error }"
            placeholder="Enter your email"
          />
          <p v-if="error" class="form-error">
            {{ error }}
          </p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="btn btn-primary w-full flex justify-center"
          >
            <div v-if="isLoading" class="spinner w-4 h-4 border-white mr-2"></div>
            <span>{{ isLoading ? 'Sending...' : 'Send reset link' }}</span>
          </button>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <div class="flex">
            <CheckCircleIcon class="h-5 w-5 text-green-400" />
            <div class="ml-3">
              <p class="text-sm text-green-800 dark:text-green-200">
                Password reset link sent to your email address.
              </p>
            </div>
          </div>
        </div>

        <!-- Back to login -->
        <div class="text-center">
          <router-link 
            to="/login" 
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            Back to sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

const email = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref(false)

const handleSubmit = async () => {
  error.value = ''
  
  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  if (!/\S+@\S+\.\S+/.test(email.value)) {
    error.value = 'Please enter a valid email address'
    return
  }

  try {
    isLoading.value = true
    
  
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
    
    success.value = true
  } catch (err) {
    error.value = 'Failed to send reset link. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm;
}

.form-error {
  @apply mt-1 text-sm text-red-600 dark:text-red-400;
}

.btn {
  @apply font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed;
}

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