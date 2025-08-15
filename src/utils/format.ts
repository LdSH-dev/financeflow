/**
 * Utility functions for formatting data
 */

/**
 * Format currency values
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '$0.00'
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

/**
 * Format percentage values
 */
export const formatPercentage = (
  value: number | string,
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '0.00%'
  }

  return `${numValue.toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (
  value: number | string,
  decimals: number = 1
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '0'
  }

  const absValue = Math.abs(numValue)
  
  if (absValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(decimals)}B`
  } else if (absValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(decimals)}M`
  } else if (absValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(decimals)}K`
  }
  
  return numValue.toFixed(decimals)
}

/**
 * Format dates
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return 'Unknown'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) {
    return 'Just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else {
    return formatDate(dateObj)
  }
}

/**
 * Format file sizes
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format phone numbers
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format asset symbols (uppercase)
 */
export const formatSymbol = (symbol: string): string => {
  return symbol.toUpperCase()
}

/**
 * Format gain/loss with color classes
 */
export const formatGainLoss = (value: number): {
  text: string
  className: string
} => {
  const isPositive = value >= 0
  const formatted = formatCurrency(Math.abs(value))
  
  return {
    text: `${isPositive ? '+' : '-'}${formatted}`,
    className: isPositive ? 'text-success-600' : 'text-danger-600'
  }
}

/**
 * Format decimal numbers
 */
export const formatDecimal = (
  value: number | string,
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return '0.00'
  }

  return numValue.toFixed(decimals)
}

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[$,]/g, '')) || 0
}

/**
 * Validate and format email
 */
export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim()
}

/**
 * Format market cap
 */
export const formatMarketCap = (value: number): string => {
  return formatCompactNumber(value, 1)
}