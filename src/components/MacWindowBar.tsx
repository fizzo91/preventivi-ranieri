interface MacWindowBarProps {
  title: string
  onClose?: () => void
  onMinimize?: () => void
  onFullscreen?: () => void
  isFullscreen?: boolean
  onMouseDown?: (e: React.MouseEvent) => void
}

export function MacWindowBar({ title, onClose, onMinimize, onFullscreen, isFullscreen, onMouseDown }: MacWindowBarProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="flex items-center gap-2 px-3 py-2 bg-muted/80 border-b border-border cursor-move select-none flex-shrink-0"
    >
      <div className="flex items-center gap-1.5">
        {onClose && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="group w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 flex items-center justify-center transition-colors"
            title="Chiudi"
          >
            <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none" stroke="#4D0000" strokeWidth="1.2">
              <line x1="0.5" y1="0.5" x2="5.5" y2="5.5" />
              <line x1="5.5" y1="0.5" x2="0.5" y2="5.5" />
            </svg>
          </button>
        )}
        {onMinimize && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            className="group w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 flex items-center justify-center transition-colors"
            title="Minimizza"
          >
            <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none" stroke="#995700" strokeWidth="1.2">
              <line x1="0.5" y1="3" x2="5.5" y2="3" />
            </svg>
          </button>
        )}
        {onFullscreen && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onFullscreen}
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
        )}
      </div>

      <span className="flex-1 text-center text-xs font-semibold text-muted-foreground select-none">
        {title}
      </span>

      <div className="w-[52px]" />
    </div>
  )
}
