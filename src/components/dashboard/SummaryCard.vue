<template>
  <div class="card">
    <div class="card-body">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <component 
            :is="iconComponent" 
            class="w-8 h-8 text-primary-600"
          />
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {{ title }}
            </dt>
            <dd class="flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {{ value }}
              </div>
              <div 
                v-if="changePercent !== undefined"
                :class="[
                  'ml-2 flex items-baseline text-sm font-semibold',
                  changePercent >= 0 ? 'text-success-600' : 'text-danger-600'
                ]"
              >
                <ArrowUpIcon 
                  v-if="changePercent >= 0"
                  class="w-3 h-3 mr-0.5 flex-shrink-0 self-center"
                />
                <ArrowDownIcon 
                  v-else
                  class="w-3 h-3 mr-0.5 flex-shrink-0 self-center"
                />
                {{ Math.abs(changePercent).toFixed(2) }}%
              </div>
            </dd>
          </dl>
        </div>
      </div>
      
      <!-- Additional change info -->
      <div 
        v-if="change !== undefined" 
        class="mt-3 text-sm text-gray-600 dark:text-gray-400"
      >
        <span :class="change >= 0 ? 'text-success-600' : 'text-danger-600'">
          {{ change >= 0 ? '+' : '' }}{{ formatCurrency(change) }}
        </span>
        <span class="ml-1">today</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/solid'
import * as HeroIcons from '@heroicons/vue/24/outline'
import { formatCurrency } from '@utils/format'

interface Props {
  title: string
  value: string
  change?: number
  changePercent?: number
  icon: keyof typeof HeroIcons
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  return HeroIcons[props.icon] || HeroIcons.QuestionMarkCircleIcon
})
</script>