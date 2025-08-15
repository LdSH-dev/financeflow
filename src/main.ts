import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import App from '@/App.vue'

// Styles
import '@/assets/styles/main.css'

// Toast notifications
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Create Vue application
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
  // In production, send to error reporting service
  if (import.meta.env.PROD) {
    // Send to Sentry, LogRocket, etc.
  }
}

// Performance monitoring
if (import.meta.env.DEV) {
  app.config.performance = true
}

// Mount the application
app.mount('#app')

// Service Worker registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service worker registered successfully
      })
      .catch((registrationError) => {
        // Service worker registration failed
      })
  })
}