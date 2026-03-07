/**
 * Shared export utilities for JSON download
 */

/** Download data as a JSON file */
export function downloadJson(data: unknown, filename: string): void {
  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Export a single quote as JSON */
export function exportQuoteJson(quote: any): void {
  downloadJson(quote, `preventivo-${quote.quote_number}.json`)
}

/** Export all quotes as JSON */
export function exportAllQuotesJson(quotes: any[]): void {
  downloadJson(quotes, `preventivi-${new Date().toISOString().split('T')[0]}.json`)
}
