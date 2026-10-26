// src/utils/formatters.ts
export const formatters = {
  currency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  },

  percentage: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  },

  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  },

  date: (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  time: (date: Date | string): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  datetime: (date: Date | string): string => {
    return `${formatters.date(date)} at ${formatters.time(date)}`
  },
}