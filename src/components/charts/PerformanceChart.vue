<template>
  <div class="h-64">
    <div v-if="loading" class="h-full flex items-center justify-center">
      <div class="text-center">
        <div class="spinner w-8 h-8 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
    
    <div v-else-if="!data || !data.datasets.length" class="h-full flex items-center justify-center">
      <div class="text-center">
        <ChartBarIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    </div>
    
    <div v-else class="h-full">
      <Line
        :data="chartData"
        :options="chartOptions"
        class="h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartDataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  tension?: number
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

// Chart data computed property
const chartData = computed(() => {
  if (!props.data) return { labels: [], datasets: [] }
  
  return {
    labels: props.data.labels,
    datasets: props.data.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    }))
  }
})

// Chart options
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          const value = context.parsed.y
          return `${context.dataset.label}: ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value)}`
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false
      },
      ticks: {
        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
      }
    },
    y: {
      display: true,
      grid: {
        color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
      },
      ticks: {
        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        callback: function(value: any) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  },
  elements: {
    point: {
      hoverBackgroundColor: '#3b82f6',
      hoverBorderColor: '#1d4ed8'
    }
  }
}))
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