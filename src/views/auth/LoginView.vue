<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Sign in to FinanceFlow
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or 
          <router-link 
            to="/register" 
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </router-link>
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="form-label">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="form-input"
              :class="{ 'border-red-500': errors.email }"
              placeholder="Enter your email"
            />
            <p v-if="errors.email" class="form-error">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="form-label">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="form-input pr-10"
                :class="{ 'border-red-500': errors.password }"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="errors.password" class="form-error">
              {{ errors.password }}
            </p>
          </div>
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
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="btn btn-primary w-full flex justify-center"
          >
            <div v-if="isLoading" class="spinner w-4 h-4 border-white mr-2"></div>
            <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="loginError" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ loginError }}
              </p>
            </div>
          </div>
        </div>

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
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon 
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import type { LoginRequest } from '@types/api'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// State
const isLoading = ref(false)
const showPassword = ref(false)
const loginError = ref('')

const form = reactive<LoginRequest & { rememberMe: boolean }>({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const isDevelopment = import.meta.env.DEV

// Methods
const validateForm = (): boolean => {
  // Reset errors
  errors.email = ''
  errors.password = ''

  let isValid = true

  // Email validation
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }

  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isLoading.value = true
    loginError.value = ''

    await authStore.login({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    })

    // Redirect to intended page or dashboard
    const redirectTo = router.currentRoute.value.query.redirect as string
    await router.push(redirectTo || '/dashboard')
    
  } catch (error: any) {
    console.error('Login error:', error)
    loginError.value = error.response?.data?.error?.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

const fillDemoCredentials = () => {
  form.email = 'demo@financeflow.com'
  form.password = 'demo12345'
}

// Clear errors when user types
const clearErrors = () => {
  loginError.value = ''
  errors.email = ''
  errors.password = ''
}

// Watch form changes to clear errors
import { watch } from 'vue'
watch(() => form.email, clearErrors)
watch(() => form.password, clearErrors)
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