<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <!-- 404 Icon -->
      <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-8">
        <ExclamationTriangleIcon class="w-12 h-12 text-gray-400" />
      </div>

      <!-- Error Message -->
      <h1 class="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        404
      </h1>
      
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Page not found
      </h2>
      
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
      </p>

      <!-- Action Buttons -->
      <div class="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
        <router-link
          to="/dashboard"
          class="btn btn-primary w-full sm:w-auto"
        >
          <HomeIcon class="w-4 h-4 mr-2" />
          Go to Dashboard
        </router-link>
        
        <button
          @click="goBack"
          class="btn btn-outline w-full sm:w-auto"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>

      <!-- Help Text -->
      <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>If you believe this is an error, please contact support.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const goBack = () => {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // If no history, go to dashboard
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200;
}

.btn-primary {
  @apply text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
}

.btn-outline {
  @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}
</style>