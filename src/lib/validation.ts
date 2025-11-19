import { z } from 'zod';

// Product validation schema
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Nome richiesto").max(200, "Nome troppo lungo"),
  description: z.string().max(1000, "Descrizione troppo lunga"),
  priceEM: z.number().min(0, "Prezzo EM deve essere positivo"),
  priceDT: z.number().min(0, "Prezzo DT deve essere positivo"),
  category: z.string().trim().min(1, "Categoria richiesta").max(100, "Categoria troppo lunga"),
  unit: z.string().trim().min(1, "Unità richiesta").max(20, "Unità troppo lunga")
});

export const ProductArraySchema = z.array(ProductSchema);

// Client validation schema
export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Nome richiesto").max(100, "Nome troppo lungo"),
  company: z.string().max(100, "Nome azienda troppo lungo").optional().default(""),
  email: z.string().email("Email non valida").max(255, "Email troppo lunga").or(z.literal("")),
  phone: z.string().max(20, "Telefono troppo lungo").optional().default(""),
  address: z.string().max(500, "Indirizzo troppo lungo").optional().default(""),
  notes: z.string().max(2000, "Note troppo lunghe").optional().default(""),
  createdAt: z.string()
});

export const ClientArraySchema = z.array(ClientSchema);

// Quote item validation schema
export const QuoteItemSchema = z.object({
  id: z.string(),
  description: z.string().max(500, "Descrizione troppo lunga"),
  quantity: z.number().min(0, "Quantità deve essere positiva"),
  unitPrice: z.number().min(0, "Prezzo unitario deve essere positivo"),
  total: z.number().min(0, "Totale deve essere positivo")
});

// Quote section validation schema
export const QuoteSectionSchema = z.object({
  id: z.string(),
  title: z.string().max(200, "Titolo troppo lungo"),
  items: z.array(QuoteItemSchema),
  subtotal: z.number().min(0, "Subtotale deve essere positivo")
});

// Quote validation schema
export const QuoteSchema = z.object({
  id: z.string(),
  number: z.string().max(50, "Numero preventivo troppo lungo"),
  client: z.object({
    name: z.string().max(100, "Nome cliente troppo lungo"),
    company: z.string().max(100, "Nome azienda troppo lungo").optional(),
    email: z.string().max(255, "Email troppo lunga").optional(),
    phone: z.string().max(20, "Telefono troppo lungo").optional(),
    address: z.string().max(500, "Indirizzo troppo lungo").optional()
  }),
  date: z.string(),
  validUntil: z.string(),
  status: z.enum(['bozza', 'inviato', 'accettato', 'rifiutato']),
  sections: z.array(QuoteSectionSchema).optional().default([]),
  totalAmount: z.number().min(0, "Importo totale deve essere positivo"),
  notes: z.string().max(5000, "Note troppo lunghe").optional().default(""),
  createdAt: z.string()
});

export const QuoteArraySchema = z.array(QuoteSchema);

// Settings validation schema
export const SettingsSchema = z.object({
  companyName: z.string().max(200, "Nome azienda troppo lungo").optional(),
  address: z.string().max(500, "Indirizzo troppo lungo").optional(),
  phone: z.string().max(20, "Telefono troppo lungo").optional(),
  email: z.string().email("Email non valida").max(255, "Email troppo lunga").optional().or(z.literal("")),
  website: z.string().max(200, "URL sito web troppo lungo").optional(),
  taxId: z.string().max(50, "Partita IVA troppo lunga").optional(),
  logo: z.string().optional()
});

// Backup data validation schema
export const BackupDataSchema = z.object({
  settings: SettingsSchema.optional(),
  quotes: QuoteArraySchema.optional(),
  products: ProductArraySchema.optional(),
  clients: ClientArraySchema.optional()
});
