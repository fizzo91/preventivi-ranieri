import { useMemo } from "react";
import { useQuotes } from "./useQuotes";
import { useProducts, Product } from "./useProducts";

interface ProductAssociation {
  productId: string;
  productName: string;
  category: string;
  frequency: number;
  price: number;
  unit: string;
}

interface QuoteSection {
  items?: Array<{
    productId?: string;
    productName?: string;
    category?: string;
  }>;
}

export const useProductSuggestions = (selectedProductId: string | null) => {
  const { data: quotes = [] } = useQuotes();
  const { data: products = [] } = useProducts();

  const suggestions = useMemo(() => {
    if (!selectedProductId || quotes.length === 0 || products.length === 0) {
      return [];
    }

    // Build a map of product associations
    const associationMap: Map<string, number> = new Map();

    quotes.forEach((quote) => {
      const sections = quote.sections as QuoteSection[] | null;
      if (!sections || !Array.isArray(sections)) return;

      sections.forEach((section) => {
        if (!section.items || !Array.isArray(section.items)) return;

        // Find if the selected product is in this section
        const hasSelectedProduct = section.items.some(
          (item) => item.productId === selectedProductId
        );

        if (hasSelectedProduct) {
          // Count all other products in this section
          section.items.forEach((item) => {
            if (item.productId && item.productId !== selectedProductId) {
              const count = associationMap.get(item.productId) || 0;
              associationMap.set(item.productId, count + 1);
            }
          });
        }
      });
    });

    // Convert to array and filter for LAVORAZIONE category
    const associations: ProductAssociation[] = [];

    associationMap.forEach((frequency, productId) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        // Only include if category contains "LAVORAZIONE" or "LAVORAZIONI"
        const categoryUpper = product.category.toUpperCase();
        if (
          categoryUpper.includes("LAVORAZIONE") ||
          categoryUpper.includes("LAVORAZIONI")
        ) {
          associations.push({
            productId: product.id,
            productName: product.name,
            category: product.category,
            frequency,
            price: product.price_dt,
            unit: product.unit,
          });
        }
      }
    });

    // Sort by frequency (descending) and limit to 6
    return associations
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6);
  }, [selectedProductId, quotes, products]);

  return suggestions;
};
