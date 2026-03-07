export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'draft':
    case 'bozza':
      return 'bg-muted text-muted-foreground'
    case 'sent':
    case 'inviato':
    case 'approved':
    case 'approvato':
      return 'bg-success text-success-foreground'
    case 'pending':
    case 'in attesa':
      return 'bg-warning text-warning-foreground'
    case 'rejected':
    case 'rifiutato':
      return 'bg-destructive text-destructive-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export const groupQuotesByMonth = (quotes: any[]) => {
  const groups: { [key: string]: any[] } = {}
  quotes.forEach(quote => {
    const date = new Date(quote.date)
    const monthYear = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    if (!groups[monthYear]) groups[monthYear] = []
    groups[monthYear].push(quote)
  })

  Object.keys(groups).forEach(month => {
    groups[month].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const sortedMonths = Object.keys(groups).sort((a, b) => {
    const dateA = new Date(groups[a][0].date)
    const dateB = new Date(groups[b][0].date)
    return dateB.getTime() - dateA.getTime()
  })

  return { groups, sortedMonths }
}
