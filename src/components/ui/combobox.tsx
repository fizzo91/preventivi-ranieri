import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxOption {
  value: string
  label: string
  price?: number
  unit?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  placeholder?: string
  onSelect: (value: string) => void
  searchPlaceholder?: string
  recentIds?: string[]
}

export function Combobox({
  options,
  value,
  placeholder = "Seleziona...",
  onSelect,
  searchPlaceholder = "Cerca...",
  recentIds = []
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const { recentOptions, otherOptions } = React.useMemo(() => {
    if (recentIds.length === 0) {
      return { recentOptions: [], otherOptions: options }
    }
    
    const recentSet = new Set(recentIds)
    const recent: ComboboxOption[] = []
    const other: ComboboxOption[] = []
    
    options.forEach(option => {
      if (recentSet.has(option.value)) {
        recent.push(option)
      } else {
        other.push(option)
      }
    })
    
    // Sort recent by the order in recentIds
    recent.sort((a, b) => recentIds.indexOf(a.value) - recentIds.indexOf(b.value))
    
    return { recentOptions: recent, otherOptions: other }
  }, [options, recentIds])

  const renderOption = (option: ComboboxOption) => (
    <CommandItem
      key={option.value}
      value={option.label}
      onSelect={(currentValue) => {
        const selectedOption = options.find(opt => opt.label === currentValue)
        onSelect(selectedOption ? selectedOption.value : "")
        setOpen(false)
      }}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === option.value ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="flex flex-col">
        <span>{option.label}</span>
        {option.price && option.unit && (
          <span className="text-sm text-muted-foreground">
            €{option.price.toFixed(2)}/{option.unit}
          </span>
        )}
      </div>
    </CommandItem>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left"
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] sm:w-[400px] md:w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nessun prodotto trovato.</CommandEmpty>
            {recentOptions.length > 0 && (
              <CommandGroup heading="Usati di recente">
                {recentOptions.map(renderOption)}
              </CommandGroup>
            )}
            <CommandGroup heading={recentOptions.length > 0 ? "Tutti i prodotti" : undefined}>
              {otherOptions.map(renderOption)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
