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
      <div class="mt-8">
        <LoginForm
          ref="loginFormRef"
          :is-loading="isLoading"
          :login-error="loginError"
          :is-development="isDevelopment"
          @submit="handleLogin"
          @fill-demo-credentials="fillDemoCredentials"
        />
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LoginForm } from '@components/form'
import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import type { LoginRequest } from '@types/api'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// State
const isLoading = ref(false)
const loginError = ref('')
const loginFormRef = ref()

const isDevelopment = import.meta.env.DEV

// Methods
const validateForm = (): boolean => {
  const form = loginFormRef.value?.form
  const errors = loginFormRef.value?.errors
  
  if (!form || !errors) return false

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

const handleLogin = async (formData: LoginRequest & { rememberMe: boolean }) => {
  if (!validateForm()) {
    return
  }

  try {
    isLoading.value = true
    loginError.value = ''

    await authStore.login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe
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
  if (loginFormRef.value?.form) {
    loginFormRef.value.form.email = 'demo@financeflow.com'
    loginFormRef.value.form.password = 'demo12345'
  }
}
</script>

