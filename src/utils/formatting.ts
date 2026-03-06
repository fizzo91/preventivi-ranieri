/**
 * Shared formatting utilities
 */

/** Format a number as EUR currency */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

/** Format a number to fixed decimal places with Italian locale */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Format a date to Italian locale */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('it-IT')
}

/** Format a date to month/year for grouping */
export function formatMonthYear(date: string | Date): string {
  return new Date(date).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })
}

/** Round up to 2 decimal places */
export function roundUp(value: number): number {
  return Math.ceil(value * 100) / 100
}
