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
            Edit Portfolio
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Update your portfolio information
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="animate-pulse space-y-6">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Form -->
    <div v-else-if="portfolio" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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
            :disabled="isUpdating || !isFormValid"
            class="btn btn-primary"
          >
            <span v-if="isUpdating" class="flex items-center">
              <svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating Portfolio...
            </span>
            <span v-else>
              Update Portfolio
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- Error State -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
      <div class="text-red-500 mb-4">
        <ExclamationTriangleIcon class="w-12 h-12 mx-auto" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Portfolio Not Found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        The portfolio you're trying to edit could not be found.
      </p>
      <button @click="goBack" class="btn btn-primary">
        Go Back
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'

// Types
import type { UpdatePortfolioRequest } from '@types/api'
import type { Portfolio } from '@types/portfolio'

const router = useRouter()
const route = useRoute()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()

// Props
const props = defineProps<{
  id: string
}>()

// State
const isLoading = ref(true)
const isUpdating = ref(false)
const portfolio = ref<Portfolio | null>(null)

const form = reactive({
  name: '',
  description: '',
  currency: 'USD'
})

const errors = reactive({
  name: '',
  description: '',
  currency: ''
})

// Computed
const isFormValid = computed(() => {
  return form.name.trim().length > 0 &&
         form.currency.length > 0 &&
         !Object.values(errors).some(error => error.length > 0)
})

// Methods
const loadPortfolio = async () => {
  isLoading.value = true
  try {
    // Check if portfolio is already in store
    const existingPortfolio = portfolioStore.portfolioById(props.id)
    
    if (existingPortfolio) {
      portfolio.value = existingPortfolio
    } else {
      // Fetch portfolio from API
      const fetchedPortfolio = await portfolioStore.fetchPortfolio(props.id)
      if (fetchedPortfolio) {
        portfolio.value = fetchedPortfolio
      }
    }
    
    if (portfolio.value) {
      // Populate form with portfolio data
      form.name = portfolio.value.name
      form.description = portfolio.value.description || ''
      form.currency = portfolio.value.currency
    }
  } catch (error) {
    console.error('Failed to load portfolio:', error)
    uiStore.showError('Error', 'Failed to load portfolio data')
  } finally {
    isLoading.value = false
  }
}

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
  if (!validateForm() || !portfolio.value) {
    return
  }

  isUpdating.value = true

  try {
    const updateData: UpdatePortfolioRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      currency: form.currency
    }

    const success = await portfolioStore.updatePortfolio(portfolio.value.id, updateData)

    if (success) {
      uiStore.showSuccess('Success', 'Portfolio updated successfully!')
      router.push(`/portfolios/${portfolio.value.id}`)
    }
  } catch (error) {
    console.error('Failed to update portfolio:', error)
    uiStore.showError('Error', 'Failed to update portfolio. Please try again.')
  } finally {
    isUpdating.value = false
  }
}

const goBack = () => {
  router.back()
}

// Lifecycle
onMounted(async () => {
  // Set breadcrumb
  uiStore.setBreadcrumb(['Portfolios', 'Edit'])
  
  // Load portfolio data
  await loadPortfolio()
})
</script>