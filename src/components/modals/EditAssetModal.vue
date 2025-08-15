<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background backdrop -->
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100" id="modal-title">
              Edit Asset
            </h3>
            <button
              @click="close"
              type="button"
              class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Asset Symbol (readonly) -->
            <div>
              <label for="symbol" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Symbol
              </label>
              <input
                id="symbol"
                v-model="form.symbol"
                type="text"
                readonly
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
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
                step="0.00000001"
                min="0"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.quantity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                ]"
                placeholder="Enter quantity"
              />
              <p v-if="errors.quantity" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.quantity }}
              </p>
            </div>

            <!-- Current Price -->
            <div>
              <label for="currentPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Price *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 dark:text-gray-400 text-sm">$</span>
                </div>
                <input
                  id="currentPrice"
                  v-model.number="form.currentPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  :class="[
                    'w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.currentPrice ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  ]"
                  placeholder="0.00"
                />
              </div>
              <p v-if="errors.currentPrice" class="mt-1 text-sm text-red-600 dark:text-red-400">
                {{ errors.currentPrice }}
              </p>
            </div>

            <!-- Market Value (calculated, readonly) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market Value
              </label>
              <div class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {{ formatCurrency(marketValue) }}
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            @click="handleSubmit"
            :disabled="isSubmitting"
            type="button"
            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating...
            </span>
            <span v-else>Update Asset</span>
          </button>
          <button
            @click="close"
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-600 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 sm:mt-0 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { formatCurrency } from '@utils/format'
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'
import type { Asset, UpdateAssetRequest } from '@types/portfolio'

interface Props {
  isOpen: boolean
  asset: Asset | null
  portfolioId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()

// Form state
const form = ref({
  symbol: '',
  quantity: 0,
  currentPrice: 0
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// Computed
const marketValue = computed(() => {
  return form.value.quantity * form.value.currentPrice
})

// Watch for asset changes to populate form
watch(() => props.asset, (newAsset) => {
  if (newAsset) {
    form.value = {
      symbol: newAsset.symbol,
      quantity: newAsset.quantity,
      currentPrice: newAsset.currentPrice
    }
    errors.value = {}
  }
}, { immediate: true })

// Methods
const close = () => {
  emit('close')
}

const validateForm = () => {
  errors.value = {}

  if (!form.value.quantity || form.value.quantity <= 0) {
    errors.value.quantity = 'Quantity must be greater than 0'
  }

  if (!form.value.currentPrice || form.value.currentPrice <= 0) {
    errors.value.currentPrice = 'Current price must be greater than 0'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm() || !props.asset) return

  isSubmitting.value = true

  try {
    const updateData: UpdateAssetRequest = {
      quantity: form.value.quantity,
      currentPrice: form.value.currentPrice
    }
    
    await portfolioStore.updateAsset(props.portfolioId, props.asset.id, updateData)

    uiStore.showSuccess('Success', 'Asset updated successfully')
    emit('updated')
    emit('close')
  } catch (error) {
    console.error('Failed to update asset:', error)
    uiStore.showError('Error', 'Failed to update asset')
  } finally {
    isSubmitting.value = false
  }
}
</script>