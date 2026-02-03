import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  productId: string;
  productName: string;
  category: string;
  frequency: number;
  price: number;
  unit: string;
}

interface ProductSuggestionsProps {
  suggestions: Suggestion[];
  productName: string;
  onAddSuggestions: (productIds: string[]) => void;
  onDismiss: () => void;
}

export const ProductSuggestions = ({
  suggestions,
  productName,
  onAddSuggestions,
  onDismiss,
}: ProductSuggestionsProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-dismiss after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss, selectedIds]);

  if (suggestions.length === 0) {
    return null;
  }

  const toggleSelection = (productId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    if (selectedIds.size > 0) {
      onAddSuggestions(Array.from(selectedIds));
    }
  };

  const handleAddSingle = (productId: string) => {
    onAddSuggestions([productId]);
  };

  return (
    <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <span>Lavorazioni suggerite per "{productName}"</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.productId}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md border transition-colors",
                  selectedIds.has(suggestion.productId)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.has(suggestion.productId)}
                    onCheckedChange={() => toggleSelection(suggestion.productId)}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {suggestion.productName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      usato {suggestion.frequency} volt{suggestion.frequency === 1 ? "a" : "e"} • €{suggestion.price.toFixed(2)}/{suggestion.unit}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleAddSingle(suggestion.productId)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={handleAddSelected}
            disabled={selectedIds.size === 0}
          >
            Aggiungi selezionati ({selectedIds.size})
          </Button>
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Ignora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
