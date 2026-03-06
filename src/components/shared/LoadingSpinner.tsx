import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
}

export const LoadingSpinner = ({ message, fullScreen = true }: LoadingSpinnerProps) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'h-64'}`}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  </div>
)
