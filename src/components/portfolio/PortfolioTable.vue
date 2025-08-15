<template>
  <div class="overflow-x-auto">
    <table class="table">
      <thead class="table-header">
        <tr>
          <th class="table-header-cell">Portfolio</th>
          <th class="table-header-cell">Total Value</th>
          <th class="table-header-cell">Day Change</th>
          <th class="table-header-cell">Assets</th>
          <th class="table-header-cell">Last Updated</th>
          <th v-if="showActions" class="table-header-cell">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Loading State -->
        <tr v-if="loading" v-for="i in 3" :key="i">
          <td class="table-cell">
            <div class="skeleton h-4 w-32"></div>
          </td>
          <td class="table-cell">
            <div class="skeleton h-4 w-24"></div>
          </td>
          <td class="table-cell">
            <div class="skeleton h-4 w-20"></div>
          </td>
          <td class="table-cell">
            <div class="skeleton h-4 w-16"></div>
          </td>
          <td class="table-cell">
            <div class="skeleton h-4 w-20"></div>
          </td>
          <td v-if="showActions" class="table-cell">
            <div class="skeleton h-4 w-16"></div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="!portfolios.length">
          <td :colspan="showActions ? 6 : 5" class="table-cell text-center py-12">
            <BriefcaseIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600 dark:text-gray-400">No portfolios found</p>
            <router-link 
              to="/portfolios/create"
              class="btn btn-primary mt-4"
            >
              Create Your First Portfolio
            </router-link>
          </td>
        </tr>

        <!-- Portfolio Rows -->
        <tr 
          v-else
          v-for="portfolio in portfolios" 
          :key="portfolio.id"
          class="table-row cursor-pointer"
          @click="viewPortfolio(portfolio.id)"
        >
          <td class="table-cell">
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ portfolio.name }}
              </div>
              <div v-if="portfolio.description" class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {{ portfolio.description }}
              </div>
            </div>
          </td>
          
          <td class="table-cell">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatCurrency(portfolio.totalValue) }}
            </div>
          </td>
          
          <td class="table-cell">
            <div class="flex items-center">
              <span 
                :class="[
                  'text-sm font-medium',
                  portfolio.dayChange >= 0 ? 'text-success-600' : 'text-danger-600'
                ]"
              >
                {{ portfolio.dayChange >= 0 ? '+' : '' }}{{ formatCurrency(portfolio.dayChange) }}
              </span>
              <span 
                :class="[
                  'text-xs ml-2 px-2 py-1 rounded-full',
                  portfolio.dayChangePercent >= 0 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                    : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'
                ]"
              >
                {{ portfolio.dayChangePercent >= 0 ? '+' : '' }}{{ formatPercentage(portfolio.dayChangePercent) }}
              </span>
            </div>
          </td>
          
          <td class="table-cell">
            <span class="text-sm text-gray-900 dark:text-gray-100">
              {{ portfolio.assets?.length || 0 }}
            </span>
          </td>
          
          <td class="table-cell">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatRelativeTime(portfolio.updatedAt) }}
            </span>
          </td>
          
          <td v-if="showActions" class="table-cell">
            <div class="flex items-center space-x-2" @click.stop>
              <button
                @click="viewPortfolio(portfolio.id)"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View
              </button>
              <button
                @click="editPortfolio(portfolio.id)"
                class="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { BriefcaseIcon } from '@heroicons/vue/24/outline'
import { formatCurrency, formatPercentage, formatRelativeTime } from '@utils/format'
import type { Portfolio } from '@types/portfolio'

interface Props {
  portfolios: Portfolio[]
  loading?: boolean
  showActions?: boolean
}

defineProps<Props>()

const router = useRouter()

const viewPortfolio = (portfolioId: string) => {
  router.push(`/portfolios/${portfolioId}`)
}

const editPortfolio = (portfolioId: string) => {
  router.push(`/portfolios/${portfolioId}/edit`)
}
</script>