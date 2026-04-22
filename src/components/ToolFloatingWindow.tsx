import { useState, useRef, useCallback, useEffect, ReactNode } from "react"
import { MacWindowBar } from "./MacWindowBar"

interface ToolFloatingWindowProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  defaultWidth?: number
  defaultHeight?: number
  minWidth?: number
  minHeight?: number
}

export function ToolFloatingWindow({
  open,
  onClose,
  title,
  children,
  defaultWidth = 720,
  defaultHeight = 600,
  minWidth = 360,
  minHeight = 280,
}: ToolFloatingWindowProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 80, y: 60 })
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (open) {
      setIsMinimized(false)
      setIsFullscreen(false)
    }
  }, [open])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isFullscreen) return
      isDragging.current = true
      dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return
        setPosition({
          x: Math.max(0, ev.clientX - dragOffset.current.x),
          y: Math.max(0, ev.clientY - dragOffset.current.y),
        })
      }
      const onMouseUp = () => {
        isDragging.current = false
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [isFullscreen, position]
  )

  if (!open) return null

  const windowStyle = isFullscreen
    ? { top: 0, left: 0, width: "100vw", height: "100vh" }
    : isMinimized
    ? { top: position.y, left: position.x, width: 300, height: 40 }
    : { top: position.y, left: position.x, width: size.w, height: size.h }

  return (
    <div
      className="fixed z-50 flex flex-col rounded-lg border border-border bg-background shadow-2xl overflow-hidden"
      style={{
        ...windowStyle,
        borderRadius: isFullscreen ? 0 : 10,
      }}
    >
      <MacWindowBar
        title={title}
        onMouseDown={onMouseDown}
        onClose={onClose}
        onMinimize={() => setIsMinimized((m) => !m)}
        onFullscreen={() => {
          setIsFullscreen((f) => !f)
          setIsMinimized(false)
        }}
        isFullscreen={isFullscreen}
      />

      {!isMinimized && (
        <div className="flex-1 overflow-auto p-4">{children}</div>
      )}

      {!isFullscreen && !isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation()
            const startX = e.clientX
            const startY = e.clientY
            const startW = size.w
            const startH = size.h
            const onMove = (ev: MouseEvent) => {
              setSize({
                w: Math.max(minWidth, startW + (ev.clientX - startX)),
                h: Math.max(minHeight, startH + (ev.clientY - startY)),
              })
            }
            const onUp = () => {
              document.removeEventListener("mousemove", onMove)
              document.removeEventListener("mouseup", onUp)
            }
            document.addEventListener("mousemove", onMove)
            document.addEventListener("mouseup", onUp)
          }}
        >
          <svg className="w-3 h-3 text-muted-foreground/50 absolute bottom-0.5 right-0.5" viewBox="0 0 10 10">
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="4" x2="4" y2="9" stroke="currentColor" strokeWidth="1" />
            <line x1="9" y1="7" x2="7" y2="9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      )}
    </div>
  )
}
