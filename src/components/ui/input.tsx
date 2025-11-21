import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Only convert dot to comma for number-like inputs
      if (e.key === '.' && type !== 'email' && type !== 'password' && type !== 'url') {
        e.preventDefault();
        const input = e.currentTarget;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const value = input.value;
        input.value = value.substring(0, start) + ',' + value.substring(end);
        input.selectionStart = input.selectionEnd = start + 1;
        
        // Trigger input event to update React state
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
      
      onKeyDown?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
