<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or 
          <router-link 
            to="/login" 
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to your existing account
          </router-link>
        </p>
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- First Name -->
          <div>
            <label for="firstName" class="form-label">
              First Name
            </label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              autocomplete="given-name"
              required
              class="form-input"
              :class="{ 'border-red-500': errors.firstName }"
              placeholder="Enter your first name"
            />
            <p v-if="errors.firstName" class="form-error">
              {{ errors.firstName }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="form-label">
              Last Name
            </label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              autocomplete="family-name"
              required
              class="form-input"
              :class="{ 'border-red-500': errors.lastName }"
              placeholder="Enter your last name"
            />
            <p v-if="errors.lastName" class="form-error">
              {{ errors.lastName }}
            </p>
          </div>

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
                autocomplete="new-password"
                required
                class="form-input pr-10"
                :class="{ 'border-red-500': errors.password }"
                placeholder="Create a password"
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
            
            <!-- Password strength indicator -->
            <div class="mt-2">
              <div class="flex space-x-1">
                <div 
                  v-for="i in 4" 
                  :key="i"
                  :class="[
                    'h-1 w-1/4 rounded',
                    getPasswordStrengthColor(i)
                  ]"
                ></div>
              </div>
              <p class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {{ passwordStrengthText }}
              </p>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="confirmPassword" class="form-label">
              Confirm Password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="form-input pr-10"
                :class="{ 'border-red-500': errors.confirmPassword }"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="form-error">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-center">
          <input
            id="acceptTerms"
            v-model="form.acceptTerms"
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="acceptTerms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            I agree to the 
            <a href="/terms" class="text-primary-600 hover:text-primary-500" target="_blank">
              Terms and Conditions
            </a>
            and
            <a href="/privacy" class="text-primary-600 hover:text-primary-500" target="_blank">
              Privacy Policy
            </a>
          </label>
        </div>
        <p v-if="errors.acceptTerms" class="form-error">
          {{ errors.acceptTerms }}
        </p>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading || !form.acceptTerms"
            class="btn btn-primary w-full flex justify-center"
          >
            <div v-if="isLoading" class="spinner w-4 h-4 border-white mr-2"></div>
            <span>{{ isLoading ? 'Creating account...' : 'Create account' }}</span>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="registerError" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ registerError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="registerSuccess" class="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <div class="flex">
            <CheckCircleIcon class="h-5 w-5 text-green-400" />
            <div class="ml-3">
              <p class="text-sm text-green-800 dark:text-green-200">
                Account created successfully! Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const registerError = ref('')
const registerSuccess = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// Password strength computation
const passwordStrength = computed(() => {
  if (!form.password) return 0
  
  let strength = 0
  
  // Length check
  if (form.password.length >= 8) strength++
  
  // Uppercase check
  if (/[A-Z]/.test(form.password)) strength++
  
  // Lowercase check
  if (/[a-z]/.test(form.password)) strength++
  
  // Number or special character check
  if (/[\d\W]/.test(form.password)) strength++
  
  return strength
})

const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1:
      return 'Weak password'
    case 2:
      return 'Fair password'
    case 3:
      return 'Good password'
    case 4:
      return 'Strong password'
    default:
      return ''
  }
})

const getPasswordStrengthColor = (index: number) => {
  if (passwordStrength.value < index) {
    return 'bg-gray-200 dark:bg-gray-700'
  }
  
  switch (passwordStrength.value) {
    case 1:
      return 'bg-red-400'
    case 2:
      return 'bg-yellow-400'
    case 3:
      return 'bg-blue-400'
    case 4:
      return 'bg-green-400'
    default:
      return 'bg-gray-200 dark:bg-gray-700'
  }
}

// Methods
const validateForm = (): boolean => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // First name validation
  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required'
    isValid = false
  } else if (form.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
    isValid = false
  }

  // Last name validation
  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required'
    isValid = false
  } else if (form.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
    isValid = false
  }

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
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  } else if (passwordStrength.value < 2) {
    errors.password = 'Password is too weak. Please include uppercase, lowercase, and numbers/symbols'
    isValid = false
  }

  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  // Terms acceptance validation
  if (!form.acceptTerms) {
    errors.acceptTerms = 'You must accept the terms and conditions'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isLoading.value = true
    registerError.value = ''
    registerSuccess.value = false

    await authStore.register({
      email: form.email,
      password: form.password,
      password_confirm: form.confirmPassword,
      first_name: form.firstName,
      last_name: form.lastName,
      accept_terms: form.acceptTerms
    })

    registerSuccess.value = true
    
    // Redirect after a short delay to show success message
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    
  } catch (error: any) {
    console.error('Registration error:', error)
    registerError.value = error.response?.data?.error?.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Clear errors when user types
const clearErrors = () => {
  registerError.value = ''
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

// Watch form changes to clear errors
import { watch } from 'vue'
watch(() => form.email, clearErrors)
watch(() => form.password, clearErrors)
watch(() => form.confirmPassword, clearErrors)
watch(() => form.firstName, clearErrors)
watch(() => form.lastName, clearErrors)
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
</style>