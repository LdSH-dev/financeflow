<template>
  <div v-if="message" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
    <div class="flex">
      <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
      <div class="ml-3">
        <p class="text-sm text-red-800 dark:text-red-200">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface Props {
  message?: string
}

defineProps<Props>()
</script> 