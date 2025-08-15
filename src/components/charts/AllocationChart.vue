<template>
  <div class="h-64 flex items-center justify-center">
    <div v-if="loading" class="text-center">
      <div class="spinner w-8 h-8 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">Loading chart...</p>
    </div>
    
    <div v-else-if="!data || !data.datasets.length" class="text-center">
      <ChartPieIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-600 dark:text-gray-400">No allocation data</p>
    </div>
    
    <div v-else class="w-full h-full flex items-center justify-center">
      <!-- Dynamic Pie Chart -->
      <div class="relative w-48 h-48">
        <!-- Dynamic pie chart with CSS -->
        <div 
          class="w-full h-full rounded-full relative overflow-hidden" 
          :style="{ background: generateConicGradient() }"
        >
          <!-- Center circle -->
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
            <div class="text-center">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">100%</p>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="absolute -right-24 top-0 space-y-2">
          <div v-for="(label, index) in data.labels" :key="label" class="flex items-center text-xs">
            <div 
              class="w-3 h-3 rounded-full mr-2"
              :style="{ backgroundColor: data.datasets[0].backgroundColor[index] }"
            ></div>
            <span class="text-gray-700 dark:text-gray-300">{{ formatLabel(label) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChartPieIcon } from '@heroicons/vue/24/outline'

interface ChartDataset {
  data: number[]
  backgroundColor: string[]
}

interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

interface Props {
  data?: ChartData
  loading?: boolean
}

const props = defineProps<Props>()

// Generate dynamic conic gradient based on data
const generateConicGradient = () => {
  if (!props.data?.datasets?.[0]?.data?.length) {
    return 'conic-gradient(#E5E7EB 0deg 360deg)'
  }

  const { data: rawValues, backgroundColor: colors } = props.data.datasets[0]
  
  // Ensure all values are numbers
  const values = rawValues.map(value => Number(value) || 0)
  const total = values.reduce((sum, value) => sum + value, 0)
  
  if (total === 0) {
    return 'conic-gradient(#E5E7EB 0deg 360deg)'
  }

  let currentAngle = 0
  const gradientStops: string[] = []

  values.forEach((value, index) => {
    const percentage = (value / total) * 100
    const angle = (percentage / 100) * 360
    const color = colors[index] || '#E5E7EB'
    
    // Only add segments with meaningful size (> 0.1%)
    if (percentage > 0.1) {
      gradientStops.push(`${color} ${currentAngle}deg ${currentAngle + angle}deg`)
      currentAngle += angle
    }
  })

  // If no meaningful segments, show default
  if (gradientStops.length === 0) {
    return 'conic-gradient(#E5E7EB 0deg 360deg)'
  }

  return `conic-gradient(${gradientStops.join(', ')})`
}

// Format asset type labels for display
const formatLabel = (label: string) => {
  const labelMap: Record<string, string> = {
    'stock': 'Stocks',
    'crypto': 'Crypto',
    'etf': 'ETFs',
    'bond': 'Bonds',
    'commodity': 'Commodities',
    'real_estate': 'Real Estate',
    'cash': 'Cash'
  }
  return labelMap[label] || label.charAt(0).toUpperCase() + label.slice(1)
}
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