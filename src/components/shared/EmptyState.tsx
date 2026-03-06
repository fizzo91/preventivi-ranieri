import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({ icon: Icon, message, actionLabel, onAction }: EmptyStateProps) => (
  <Card>
    <CardContent className="text-center py-8">
      {Icon && <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />}
      <p className="text-muted-foreground mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </CardContent>
  </Card>
)
