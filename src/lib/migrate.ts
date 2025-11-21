import { supabase } from "@/integrations/supabase/client";

export interface MigrationResult {
  success: boolean;
  counts: {
    products: number;
    clients: number;
    quotes: number;
    settings: boolean;
  };
  errors: string[];
}

export const readLocalStorageData = () => {
  const products = JSON.parse(localStorage.getItem("products") || "[]");
  const clients = JSON.parse(localStorage.getItem("clients") || "[]");
  const quotes = JSON.parse(localStorage.getItem("quotes") || "[]");
  const settings = JSON.parse(localStorage.getItem("companySettings") || "null");

  return { products, clients, quotes, settings };
};

export const hasLocalStorageData = () => {
  const { products, clients, quotes, settings } = readLocalStorageData();
  return products.length > 0 || clients.length > 0 || quotes.length > 0 || settings !== null;
};

export const performFullMigration = async (userId: string): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    counts: {
      products: 0,
      clients: 0,
      quotes: 0,
      settings: false,
    },
    errors: [],
  };

  try {
    const { products, clients, quotes, settings } = readLocalStorageData();

    // Migrate products
    if (products.length > 0) {
      for (const product of products) {
        try {
          const { error } = await supabase.from("products").insert({
            user_id: userId,
            name: product.name,
            description: product.description || null,
            price_em: product.priceEM || 0,
            price_dt: product.priceDT || 0,
            category: product.category,
            unit: product.unit,
          });

          if (error) throw error;
          result.counts.products++;
        } catch (error: any) {
          result.errors.push(`Prodotto "${product.name}": ${error.message}`);
        }
      }
    }

    // Migrate clients
    if (clients.length > 0) {
      for (const client of clients) {
        try {
          const { error } = await supabase.from("clients").insert({
            user_id: userId,
            name: client.name,
            email: client.email || null,
            phone: client.phone || null,
            company: client.company || null,
            address: client.address || null,
            vat_number: client.vatNumber || null,
            fiscal_code: client.fiscalCode || null,
            notes: client.notes || null,
          });

          if (error) throw error;
          result.counts.clients++;
        } catch (error: any) {
          result.errors.push(`Cliente "${client.name}": ${error.message}`);
        }
      }
    }

    // Migrate quotes
    if (quotes.length > 0) {
      for (const quote of quotes) {
        try {
          const { error } = await supabase.from("quotes").insert({
            user_id: userId,
            quote_number: quote.number,
            client_name: quote.client.name,
            client_email: quote.client.email || null,
            client_phone: quote.client.phone || null,
            client_company: quote.client.company || null,
            client_address: quote.client.address || null,
            client_vat_number: quote.client.vatNumber || null,
            client_fiscal_code: quote.client.fiscalCode || null,
            date: quote.date,
            validity_days: quote.validityDays || 30,
            sections: quote.sections || [],
            payment_terms: quote.paymentTerms || null,
            notes: quote.notes || null,
            total_amount: quote.totalAmount || 0,
            status: quote.status || "draft",
          });

          if (error) throw error;
          result.counts.quotes++;
        } catch (error: any) {
          result.errors.push(`Preventivo "${quote.number}": ${error.message}`);
        }
      }
    }

    // Migrate company settings to profile
    if (settings) {
      try {
        const { error } = await supabase.from("profiles").update({
          company_name: settings.companyName || null,
          address: settings.address || null,
          phone: settings.phone || null,
          vat_number: settings.vatNumber || null,
          tax_code: settings.taxCode || null,
          website: settings.website || null,
          notes: settings.notes || null,
          logo: settings.logo || null,
        }).eq("id", userId);

        if (error) throw error;
        result.counts.settings = true;
      } catch (error: any) {
        result.errors.push(`Impostazioni: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Errore generale: ${error.message}`);
    return result;
  }
};

export const clearLocalStorageAfterMigration = () => {
  localStorage.removeItem("products");
  localStorage.removeItem("clients");
  localStorage.removeItem("quotes");
  localStorage.removeItem("companySettings");
  localStorage.setItem("migrationCompleted", "true");
};
