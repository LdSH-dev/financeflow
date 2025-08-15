<template>
  <div class="container mx-auto px-4 py-6 max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4 mb-4">
        <button
          @click="goBack"
          class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create Portfolio
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Create a new investment portfolio to track your assets
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Portfolio Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Portfolio Name *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            maxlength="100"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
            placeholder="Enter portfolio name"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.name }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ form.name.length }}/100 characters
          </p>
        </div>

        <!-- Portfolio Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            maxlength="500"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
            placeholder="Optional description for your portfolio"
          ></textarea>
          <p v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.description }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ (form.description || '').length }}/500 characters
          </p>
        </div>

        <!-- Currency -->
        <div>
          <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Base Currency *
          </label>
          <select
            id="currency"
            v-model="form.currency"
            required
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors.currency ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
          >
            <option value="">Select a currency</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
            <option value="CNY">CNY - Chinese Yuan</option>
            <option value="BRL">BRL - Brazilian Real</option>
          </select>
          <p v-if="errors.currency" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.currency }}
          </p>
        </div>

        <!-- Portfolio Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Portfolio Type
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              v-for="type in portfolioTypes"
              :key="type.value"
              :class="[
                'relative flex cursor-pointer rounded-lg border p-4 focus:outline-none',
                form.portfolioType === type.value
                  ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <input
                v-model="form.portfolioType"
                type="radio"
                :value="type.value"
                class="sr-only"
              />
              <div class="flex flex-1">
                <div class="flex flex-col">
                  <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ type.label }}
                  </span>
                  <span class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {{ type.description }}
                  </span>
                </div>
              </div>
              <CheckCircleIcon
                v-if="form.portfolioType === type.value"
                class="h-5 w-5 text-primary-600"
              />
            </label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="goBack"
            class="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isCreating || !isFormValid"
            class="btn btn-primary"
          >
            <span v-if="isCreating" class="flex items-center">
              <svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Portfolio...
            </span>
            <span v-else>
              Create Portfolio
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'

// Types
import type { CreatePortfolioRequest } from '@types/api'

const router = useRouter()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()

// State
const isCreating = ref(false)

const form = reactive({
  name: '',
  description: '',
  currency: 'USD',
  portfolioType: 'investment'
})

const errors = reactive({
  name: '',
  description: '',
  currency: ''
})

// Portfolio types
const portfolioTypes = [
  {
    value: 'investment',
    label: 'Investment Portfolio',
    description: 'For stocks, bonds, ETFs, and other investments'
  },
  {
    value: 'crypto',
    label: 'Cryptocurrency Portfolio',
    description: 'For digital currencies and crypto assets'
  },
  {
    value: 'retirement',
    label: 'Retirement Portfolio',
    description: 'For long-term retirement planning'
  },
  {
    value: 'trading',
    label: 'Trading Portfolio',
    description: 'For active trading and short-term investments'
  }
]

// Computed
const isFormValid = computed(() => {
  return form.name.trim().length > 0 &&
         form.currency.length > 0 &&
         !Object.values(errors).some(error => error.length > 0)
})

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  // Validate name
  if (!form.name.trim()) {
    errors.name = 'Portfolio name is required'
  } else if (form.name.trim().length < 3) {
    errors.name = 'Portfolio name must be at least 3 characters'
  } else if (form.name.length > 100) {
    errors.name = 'Portfolio name cannot exceed 100 characters'
  }

  // Validate description
  if (form.description && form.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters'
  }

  // Validate currency
  if (!form.currency) {
    errors.currency = 'Please select a base currency'
  }

  return Object.values(errors).every(error => !error)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isCreating.value = true

  try {
    const portfolioData: CreatePortfolioRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      currency: form.currency,
      portfolioType: form.portfolioType
    }

    const newPortfolio = await portfolioStore.createPortfolio(portfolioData)

    if (newPortfolio) {
      uiStore.showSuccess('Success', 'Portfolio created successfully!')
      router.push(`/portfolios/${newPortfolio.id}`)
    }
  } catch (error) {
    console.error('Failed to create portfolio:', error)
    uiStore.showError('Error', 'Failed to create portfolio. Please try again.')
  } finally {
    isCreating.value = false
  }
}

const goBack = () => {
  router.back()
}

// Set breadcrumb
uiStore.setBreadcrumb(['Portfolios', 'Create'])
</script>