import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { MacWindowBar } from "@/components/MacWindowBar";
import { cn } from "@/lib/utils";
import { ImperialConverter } from "@/components/ImperialConverter";
import { CircleCalculator } from "@/components/CircleCalculator";
import { DescriptionAssistant } from "@/components/DescriptionAssistant";
import { Glossary } from "@/components/Glossary";
import { VanityCalculator } from "@/components/VanityCalculator";
import { ClientResearch } from "@/components/ClientResearch";
import { ScientificCalculator } from "@/components/ScientificCalculator";

export interface FloatingWindowState {
  id: string;
  toolId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
}

interface FloatingWindowContextType {
  windows: FloatingWindowState[];
  openWindow: (toolId: string, title?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  isOpen: (toolId: string) => boolean;
}

const FloatingWindowContext = createContext<FloatingWindowContextType | null>(null);

const toolMeta: Record<string, { title: string; width: number; height: number }> = {
  imperial: { title: "Convertitore Pollici/Piedi → mm", width: 480, height: 600 },
  circle: { title: "Calcolo Cerchi", width: 480, height: 650 },
  descriptions: { title: "Assistente Descrizioni", width: 560, height: 800 },
  glossary: { title: "Glossario Pietra", width: 520, height: 700 },
  vanity: { title: "Calcolo Vanity", width: 600, height: 850 },
  "client-research": { title: "Ricerca Cliente AI", width: 500, height: 700 },
  calculator: { title: "Calcolatrice Scientifica", width: 700, height: 750 },
};

let globalZ = 100;

export function FloatingWindowProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<FloatingWindowState[]>([]);

  const openWindow = useCallback((toolId: string, title?: string) => {
    if (!toolMeta[toolId]) return;
    const meta = toolMeta[toolId];
    const id = `${toolId}-${Date.now()}`;
    const w = meta.width;
    const h = meta.height;
    // Center on viewport
    const x = Math.max(20, Math.round((window.innerWidth - w) / 2));
    const y = Math.max(20, Math.round((window.innerHeight - h) / 2));
    globalZ += 1;
    setWindows((prev) => [
      ...prev,
      { id, toolId, title: title || meta.title, x, y, width: w, height: h, minimized: false, zIndex: globalZ },
    ]);
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    globalZ += 1;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: false, zIndex: globalZ } : w))
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    globalZ += 1;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: globalZ } : w)));
  }, []);

  const isOpen = useCallback(
    (toolId: string) => windows.some((w) => w.toolId === toolId && !w.minimized),
    [windows]
  );

  return (
    <FloatingWindowContext.Provider
      value={{ windows, openWindow, closeWindow, minimizeWindow, restoreWindow, bringToFront, isOpen }}
    >
      {children}
    </FloatingWindowContext.Provider>
  );
}

export function useFloatingWindows() {
  const ctx = useContext(FloatingWindowContext);
  if (!ctx) throw new Error("useFloatingWindows must be used within FloatingWindowProvider");
  return ctx;
}

function ToolContent({ toolId }: { toolId: string }) {
  switch (toolId) {
    case "imperial":
      return <ImperialConverter />;
    case "circle":
      return <CircleCalculator />;
    case "descriptions":
      return <DescriptionAssistant />;
    case "glossary":
      return <Glossary />;
    case "vanity":
      return <VanityCalculator />;
    case "client-research":
      return <ClientResearch />;
    case "calculator":
      return <ScientificCalculator />;
    default:
      return null;
  }
}

export function FloatingWindowContainer() {
  const { windows, closeWindow, minimizeWindow, restoreWindow, bringToFront } = useFloatingWindows();

  if (windows.length === 0) return null;

  return (
    <>
      {windows.map((win) => (
        <FloatingWindowItem
          key={win.id}
          win={win}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onRestore={() => restoreWindow(win.id)}
          onFocus={() => bringToFront(win.id)}
        />
      ))}
    </>
  );
}

function FloatingWindowItem({
  win,
  onClose,
  onMinimize,
  onRestore,
  onFocus,
}: {
  win: FloatingWindowState;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onFocus: () => void;
}) {
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  // Sync external state for restore/minimize changes
  useEffect(() => {
    setPos({ x: win.x, y: win.y });
  }, [win.x, win.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    onFocus();
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  if (win.minimized) {
    return (
      <div
        ref={elRef}
        className="fixed rounded-lg shadow-xl border border-border overflow-hidden bg-card"
        style={{ left: pos.x, top: pos.y, width: 280, zIndex: win.zIndex }}
        onMouseDown={onFocus}
      >
        <MacWindowBar
          title={win.title}
          onClose={onClose}
          onFullscreen={() => onRestore()}
          isFullscreen={false}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }

  const style: React.CSSProperties = isFullscreen
    ? { left: 0, top: 0, width: "100%", height: "100%", zIndex: win.zIndex }
    : { left: pos.x, top: pos.y, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      ref={elRef}
      className={cn(
        "fixed flex flex-col bg-card border border-border shadow-xl overflow-hidden",
        isDragging && "cursor-move select-none"
      )}
      style={style}
      onMouseDown={onFocus}
    >
      <MacWindowBar
        title={win.title}
        onClose={onClose}
        onMinimize={onMinimize}
        onFullscreen={() => {
          if (!isFullscreen) {
            setIsFullscreen(true);
          } else {
            setIsFullscreen(false);
          }
        }}
        isFullscreen={isFullscreen}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 overflow-auto">
        <div className={cn("p-4 mx-auto w-full space-y-6", win.toolId === "calculator" ? "max-w-2xl" : "max-w-lg")}>
          <ToolContent toolId={win.toolId} />
        </div>
      </div>
    </div>
  );
}
