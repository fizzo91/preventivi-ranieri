import { useState, useRef, useCallback, useEffect } from "react"
import { EnamelCostCalculator, type EnamelPieceRow } from "./EnamelCostCalculator"

interface EnamelCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: EnamelPieceRow[]
  onChange: (rows: EnamelPieceRow[]) => void
}

export function EnamelCostDialog({ open, onOpenChange, value, onChange }: EnamelCostDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 60, y: 40 })
  const [size, setSize] = useState({ w: 1100, h: 600 })
  const dragRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setIsMinimized(false)
    }
  }, [open])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isFullscreen) return
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }

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
  }, [isFullscreen, position])

  if (!open) return null

  const windowStyle = isFullscreen
    ? { top: 0, left: 0, width: "100vw", height: "100vh" }
    : isMinimized
    ? { top: position.y, left: position.x, width: 300, height: 40 }
    : { top: position.y, left: position.x, width: size.w, height: size.h }

  return (
    <div
      ref={dragRef}
      className="fixed z-50 flex flex-col rounded-lg border border-border bg-background shadow-2xl overflow-hidden"
      style={{
        ...windowStyle,
        borderRadius: isFullscreen ? 0 : 10,
        transition: isDragging.current ? "none" : "width 0.2s, height 0.2s, top 0.2s, left 0.2s",
      }}
    >
      {/* ── macOS-style title bar ── */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center gap-2 px-3 py-2 bg-muted/80 border-b border-border cursor-move select-none flex-shrink-0"
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          {/* Close (red) */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onOpenChange(false)}
            className="group w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 flex items-center justify-center transition-colors"
            title="Chiudi"
          >
            <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none" stroke="#4D0000" strokeWidth="1.2">
              <line x1="0.5" y1="0.5" x2="5.5" y2="5.5" />
              <line x1="5.5" y1="0.5" x2="0.5" y2="5.5" />
            </svg>
          </button>
          {/* Minimize (yellow) */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="group w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 flex items-center justify-center transition-colors"
            title="Minimizza"
          >
            <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none" stroke="#995700" strokeWidth="1.2">
              <line x1="0.5" y1="3" x2="5.5" y2="3" />
            </svg>
          </button>
          {/* Fullscreen (green) */}
          <button
            onClick={() => { setIsFullscreen(!isFullscreen); setIsMinimized(false) }}
            className="group w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 flex items-center justify-center transition-colors"
            title="Schermo intero"
          >
            <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none" stroke="#006500" strokeWidth="1">
              {isFullscreen ? (
                <>
                  <polyline points="1,2.5 1,1 2.5,1" />
                  <polyline points="3.5,5 5,5 5,3.5" />
                </>
              ) : (
                <>
                  <polyline points="0.5,3.5 0.5,5.5 2.5,5.5" />
                  <polyline points="5.5,2.5 5.5,0.5 3.5,0.5" />
                </>
              )}
            </svg>
          </button>
        </div>

        <span className="flex-1 text-center text-xs font-semibold text-muted-foreground select-none">
          Calcolatore Costi Smalto
        </span>

        {/* Spacer to balance traffic lights */}
        <div className="w-[52px]" />
      </div>

      {/* ── Content ── */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <EnamelCostCalculator value={value} onChange={onChange} />
        </div>
      )}

      {/* ── Resize handle (bottom-right corner) ── */}
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
                w: Math.max(600, startW + (ev.clientX - startX)),
                h: Math.max(300, startH + (ev.clientY - startY)),
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
