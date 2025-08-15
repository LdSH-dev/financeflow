/**
 * Tests for formatting utilities
 */

import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  formatSymbol,
  formatGainLoss,
  formatDecimal,
  parseCurrency,
  formatEmail,
  formatMarketCap
} from '@utils/format'

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(1000.5)).toBe('$1,000.50')
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00')
      expect(formatCurrency(-1000.5)).toBe('-$1,000.50')
    })

    it('should handle string inputs', () => {
      expect(formatCurrency('1000')).toBe('$1,000.00')
      expect(formatCurrency('1000.5')).toBe('$1,000.50')
    })

    it('should handle invalid inputs', () => {
      expect(formatCurrency('invalid')).toBe('$0.00')
      expect(formatCurrency(NaN)).toBe('$0.00')
    })

    it('should support different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(50)).toBe('50.00%')
      expect(formatPercentage(50.5)).toBe('50.50%')
      expect(formatPercentage(-25)).toBe('-25.00%')
    })

    it('should handle different decimal places', () => {
      expect(formatPercentage(50.123, 1)).toBe('50.1%')
      expect(formatPercentage(50.123, 3)).toBe('50.123%')
    })

    it('should handle invalid inputs', () => {
      expect(formatPercentage('invalid')).toBe('0.00%')
      expect(formatPercentage(NaN)).toBe('0.00%')
    })
  })

  describe('formatCompactNumber', () => {
    it('should format thousands correctly', () => {
      expect(formatCompactNumber(1000)).toBe('1.0K')
      expect(formatCompactNumber(1500)).toBe('1.5K')
      expect(formatCompactNumber(999)).toBe('999.0')
    })

    it('should format millions correctly', () => {
      expect(formatCompactNumber(1000000)).toBe('1.0M')
      expect(formatCompactNumber(1500000)).toBe('1.5M')
    })

    it('should format billions correctly', () => {
      expect(formatCompactNumber(1000000000)).toBe('1.0B')
      expect(formatCompactNumber(1500000000)).toBe('1.5B')
    })

    it('should handle negative numbers', () => {
      expect(formatCompactNumber(-1000)).toBe('-1.0K')
      expect(formatCompactNumber(-1000000)).toBe('-1.0M')
    })
  })

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Dec 25, 2023/)
    })

    it('should format date strings correctly', () => {
      const formatted = formatDate('2023-12-25T10:30:00Z')
      expect(formatted).toMatch(/Dec 25, 2023/)
    })

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date')
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('formatRelativeTime', () => {
    it('should format recent times correctly', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('Just now')
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago')
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890')
    })

    it('should handle invalid phone numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123')
      expect(formatPhoneNumber('invalid')).toBe('invalid')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text correctly', () => {
      const text = 'This is a very long text that should be truncated'
      expect(truncateText(text, 20)).toBe('This is a very long ...')
    })

    it('should not truncate short text', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })
  })

  describe('formatSymbol', () => {
    it('should convert symbols to uppercase', () => {
      expect(formatSymbol('aapl')).toBe('AAPL')
      expect(formatSymbol('msft')).toBe('MSFT')
      expect(formatSymbol('TSLA')).toBe('TSLA')
    })
  })

  describe('formatGainLoss', () => {
    it('should format positive gains correctly', () => {
      const result = formatGainLoss(100)
      expect(result.text).toBe('+$100.00')
      expect(result.className).toBe('text-success-600')
    })

    it('should format losses correctly', () => {
      const result = formatGainLoss(-100)
      expect(result.text).toBe('-$100.00')
      expect(result.className).toBe('text-danger-600')
    })

    it('should handle zero correctly', () => {
      const result = formatGainLoss(0)
      expect(result.text).toBe('+$0.00')
      expect(result.className).toBe('text-success-600')
    })
  })

  describe('formatDecimal', () => {
    it('should format decimals correctly', () => {
      expect(formatDecimal(10.123)).toBe('10.12')
      expect(formatDecimal(10.123, 3)).toBe('10.123')
      expect(formatDecimal(10)).toBe('10.00')
    })

    it('should handle invalid inputs', () => {
      expect(formatDecimal('invalid')).toBe('0.00')
      expect(formatDecimal(NaN)).toBe('0.00')
    })
  })

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(parseCurrency('$1,000.00')).toBe(1000)
      expect(parseCurrency('$1,000')).toBe(1000)
      expect(parseCurrency('1000')).toBe(1000)
    })

    it('should handle invalid inputs', () => {
      expect(parseCurrency('invalid')).toBe(0)
      expect(parseCurrency('')).toBe(0)
    })
  })

  describe('formatEmail', () => {
    it('should format emails correctly', () => {
      expect(formatEmail(' USER@EXAMPLE.COM ')).toBe('user@example.com')
      expect(formatEmail('Test@Example.com')).toBe('test@example.com')
    })
  })

  describe('formatMarketCap', () => {
    it('should format market cap correctly', () => {
      expect(formatMarketCap(1000000000)).toBe('1.0B')
      expect(formatMarketCap(500000000)).toBe('500.0M')
      expect(formatMarketCap(10000)).toBe('10.0K')
    })
  })
})