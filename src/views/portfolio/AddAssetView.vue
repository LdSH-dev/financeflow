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
            Add Asset
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Add a new asset to your portfolio
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
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Form -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Asset Symbol -->
        <div>
          <label for="symbol" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Symbol *
          </label>
          <div class="relative">
            <input
              id="symbol"
              v-model="form.symbol"
              type="text"
              required
              maxlength="20"
              :class="[
                'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                errors.symbol ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 uppercase'
              ]"
              placeholder="Enter asset symbol (e.g., AAPL, MSFT)"
              @input="handleSymbolInput"
              @change="getRealTimePrice(form.symbol, 'h')"
            />
            <div v-if="isSearching" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <p v-if="errors.symbol" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.symbol }}
          </p>
          <p v-if="symbolInfo" class="mt-1 text-sm text-green-600 dark:text-green-400">
            {{ symbolInfo }}
          </p>
        </div>

        <!-- Asset Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Asset Type *
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label
              v-for="type in assetTypes"
              :key="type.value"
              :class="[
                'relative flex cursor-pointer rounded-lg border p-3 focus:outline-none text-center',
                form.assetType === type.value
                  ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              <input
                v-model="form.assetType"
                type="radio"
                :value="type.value"
                class="sr-only"
                required
              />
              <div class="flex-1">
                <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ type.label }}
                </span>
              </div>
            </label>
          </div>
          <p v-if="errors.assetType" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.assetType }}
          </p>
        </div>

        <!-- Quantity -->
        <div>
          <label for="quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantity *
          </label>
          <input
            id="quantity"
            v-model.number="form.quantity"
            type="number"
            step="0.001"
            min="0"
            required
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              errors.quantity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
            placeholder="Enter number of shares/units"
          />
          <p v-if="errors.quantity" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.quantity }}
          </p>
        </div>

        <!-- Purchase Price -->
        <div>
          <label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Purchase Price *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 dark:text-gray-400 text-sm">$</span>
            </div>
            <input
              id="price"
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              required
              :class="[
                'w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                errors.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              ]"
              placeholder="0.00"
            />
          </div>
          <p v-if="errors.price" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ errors.price }}
          </p>
        </div>

        <!-- Purchase Date -->
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Purchase Date
          </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            :max="todayDate"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty to use today's date
          </p>
        </div>

        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="3"
            maxlength="500"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            ]"
            placeholder="Optional notes about this asset purchase"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ (form.notes || '').length }}/500 characters
          </p>
        </div>

        <!-- Total Cost Display -->
        <div v-if="totalCost > 0" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Investment:
            </span>
            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
              ${{ totalCost.toFixed(2) }}
            </span>
          </div>
          <!-- Show proxy calculated value for demonstration -->
          <div class="text-xs text-gray-500 mt-1">
            Proxy calculated: ${{ (form as any).totalValue?.toFixed(2) || '0.00' }}
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
            :disabled="isAdding || !isFormValid"
            class="btn btn-primary"
          >
            <span v-if="isAdding" class="flex items-center">
              <svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Asset...
            </span>
            <span v-else>
              Add Asset
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'
import axios from 'axios';

// Types
import type { AddAssetRequest, AssetType } from '@/types/portfolio'

const router = useRouter()
const route = useRoute()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()

// Props
const props = defineProps<{
  id: string
}>()

// State
const isLoading = ref(false)
const isAdding = ref(false)
const isSearching = ref(false)
const symbolInfo = ref('')

// Original form data
const formData = reactive({
  symbol: '',
  assetType: 'stock' as AssetType,
  quantity: 0,
  price: 0,
  date: '',
  notes: ''
})

// JavaScript Proxy to intercept form changes
// Actually, this more simple than I thought :)
// This proxy logs every property change and can add validation logic
const form = new Proxy(formData, {
  // Intercept property writes (when user types in form fields)
  set(target, property, value) {
    console.log(`🔧 Proxy intercepted change: ${String(property)} = ${value}`)
    
    // Custom logic for specific fields
    if (property === 'symbol') {
      // Auto-uppercase symbol and log the transformation
      const upperValue = String(value).toUpperCase()
      console.log(`📝 Symbol auto-transformed: ${value} -> ${upperValue}`)
      ;(target as any)[property] = upperValue
      return true
    }
    
    if (property === 'quantity' || property === 'price') {
      // Log numeric field changes and ensure positive values
      const numValue = Number(value)
      if (numValue < 0) {
        console.log(`⚠️ Proxy blocked negative value for ${String(property)}: ${value}`)
        return false // Block the change
      }
      console.log(`💰 Numeric field updated: ${String(property)} = ${numValue}`)
    }
    
    // Set the value on the target object using type assertion
    ;(target as any)[property] = value
    return true
  },
  
  // Intercept property reads
  get(target, property) {
    // Add computed properties through proxy
    if (property === 'isValid') {
      const valid = target.symbol.length > 0 && target.quantity > 0 && target.price > 0
      console.log(`✅ Form validation check: ${valid}`)
      return valid
    }
    
    if (property === 'totalValue') {
      const total = target.quantity * target.price
      console.log(`💵 Total value calculated: ${total}`)
      return total
    }
    
    // Return the original property value using type assertion
    return (target as any)[property]
  }
})

const errors = reactive({
  symbol: '',
  assetType: '',
  quantity: '',
  price: ''
})

// Asset types
const assetTypes = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Bond' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'commodity', label: 'Commodity' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'cash', label: 'Cash' }
]

// Computed
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const realTimePrice = ref(0)

const getRealTimePrice = async (symbol: string, type: string) => {
  if (!symbol || symbol.length < 2) return

  isSearching.value = true
  try {
    const response = await axios.get(`https://api.finazon.io/latest/finazon/us_stocks_essential/time_series?ticker=${symbol}&interval=1d&page=0&page_size=1&adjust=all&apikey=99292179d1b04eff9245a001e27226d3ro`)
    
    if (response.data?.data?.[0]?.h) {
      if (type === "h") {
        realTimePrice.value = response.data.data[0].h
        form.price = realTimePrice.value
      } else if (type === "o") {
        realTimePrice.value = response.data.data[0].o
        form.price = realTimePrice.value
      }
    }

  } catch (error) {
    console.error('Failed to fetch real-time price:', error)
  } finally {
    isSearching.value = false
  }
}

const totalCost = computed(() => {
  return form.quantity && form.price ? form.quantity * form.price : 0
})

const isFormValid = computed(() => {
  return form.symbol.trim().length > 0 &&
         form.assetType.length > 0 &&
         form.quantity > 0 &&
         form.price > 0 &&
         !Object.values(errors).some(error => error.length > 0)
})

// Helper method to handle symbol input and demonstrate proxy
const handleSymbolInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // The proxy will automatically intercept this assignment and transform it
  form.symbol = target.value
}

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  // Validate symbol
  if (!form.symbol.trim()) {
    errors.symbol = 'Asset symbol is required'
  } else if (form.symbol.trim().length < 1) {
    errors.symbol = 'Asset symbol must be at least 1 character'
  } else if (form.symbol.length > 20) {
    errors.symbol = 'Asset symbol cannot exceed 20 characters'
  }

  // Validate asset type
  if (!form.assetType) {
    errors.assetType = 'Please select an asset type'
  }

  // Validate quantity
  if (!form.quantity || form.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0'
  }

  // Validate price
  if (!form.price || form.price <= 0) {
    errors.price = 'Price must be greater than 0'
  }

  return Object.values(errors).every(error => !error)
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isAdding.value = true

  try {
    const assetData: AddAssetRequest = {
      symbol: form.symbol.trim().toUpperCase(),
      quantity: form.quantity,
      price: form.price,
      transaction_date: form.date || undefined,
      notes: form.notes.trim() || undefined
    }

    
    const success = await portfolioStore.addAsset(props.id, assetData)

    if (success) {
      uiStore.showSuccess('Success', 'Asset added successfully!')
      
      
      // Try multiple navigation approaches
      try {
        // Method 1: Standard router push
        const result = await router.push(`/portfolios/${props.id}`)
        
        // Verify navigation worked
        if (router.currentRoute.value.path === `/portfolios/${props.id}`) {
        } else {
          throw new Error('Navigation did not reach expected route')
        }
      } catch (navError) {
        console.error('❌ Router.push failed:', navError)
        
        // Method 2: Replace current route
        try {
          await router.replace(`/portfolios/${props.id}`)
        } catch (replaceError) {
          console.error('❌ Router.replace failed:', replaceError)
          
          // Method 3: Force page reload with new URL
          window.location.href = `/portfolios/${props.id}`
        }
      }
    } else {
      console.error('❌ Asset addition failed - success was false')
      uiStore.showError('Error', 'Failed to add asset. Please try again.')
    }
  } catch (error: any) {
    console.error('💥 Failed to add asset:', error)
    console.error('🔍 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    uiStore.showError('Error', 'Failed to add asset. Please try again.')
  } finally {
    isAdding.value = false
  }
}

const goBack = () => {
  router.back()
}

// Watch for symbol changes to provide feedback
watch(() => form.symbol, async (newSymbol) => {
  if (newSymbol && newSymbol.length >= 2) {
    isSearching.value = true
    try {
      // Simple validation feedback
      if (/^[A-Z]{1,10}$/.test(newSymbol)) {
        symbolInfo.value = `Symbol format looks valid`
      } else {
        symbolInfo.value = ''
      }
    } catch (error) {
      console.error('Symbol search error:', error)
    } finally {
      isSearching.value = false
    }
  } else {
    symbolInfo.value = ''
  }
})

// Lifecycle
onMounted(() => {
  // Set breadcrumb
  uiStore.setBreadcrumb(['Portfolios', 'Add Asset'])
  // Set default date to today
  form.date = todayDate.value
})
</script>