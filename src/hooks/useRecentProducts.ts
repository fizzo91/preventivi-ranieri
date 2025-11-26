import { useMemo } from "react";
import { useQuotes } from "./useQuotes";

export const useRecentProductIds = () => {
  const { data: quotes = [] } = useQuotes();

  const recentProductIds = useMemo(() => {
    const productUsage = new Map<string, Date>();

    // Extract product IDs from all quotes with their usage date
    quotes.forEach((quote) => {
      const quoteDate = new Date(quote.date);
      const sections = quote.sections || [];
      
      sections.forEach((section: any) => {
        const items = section.items || [];
        items.forEach((item: any) => {
          if (item.productId) {
            const existingDate = productUsage.get(item.productId);
            if (!existingDate || quoteDate > existingDate) {
              productUsage.set(item.productId, quoteDate);
            }
          }
        });
      });
    });

    // Sort by most recent usage and return IDs
    return Array.from(productUsage.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .map(([id]) => id)
      .slice(0, 20); // Keep top 20 most recently used
  }, [quotes]);

  return recentProductIds;
};
