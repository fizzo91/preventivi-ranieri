

## Plan: Enamel per-section, macOS popups, remove tools

### Changes Overview

**1. Enamel data per-section instead of global**

Currently `enamelData` is a single array on the quote. It needs to become per-section so each section has its own enamel calculation sheet.

- **Database**: The `enamel_data` JSONB column already exists on `quotes`. No migration needed — we'll store a map `{ [sectionId]: EnamelPieceRow[] }` instead of a flat array.
- **NewQuote.tsx**: 
  - Replace `enamelData: EnamelPieceRow[]` state with `enamelDataMap: Record<string, EnamelPieceRow[]>`
  - Move the "Costi Smalto" button from the top action bar into each section's action row (next to "Calc. Pietra", "Duplica", etc.)
  - Pass `enamelDataMap[section.id]` to the dialog when opening for that section
  - Save `enamel_data` as the full map object
- **EnamelCostDialog.tsx**: No structural changes needed, just receives per-section data
- **EnamelCostCalculator.tsx**: Add a "copy" button on each row's `TOT. RIGA` cell that copies the value to clipboard
- **usePdfGenerator.ts**: Update to iterate over sections' enamel data instead of a flat array
- **Quotes.tsx**: Update enamel data loading to handle the new map format

**2. Copy button on TOT. RIGA**

- Add a small copy icon button next to each row's total in `EnamelCostCalculator.tsx`
- On click, copy the formatted euro value to clipboard with a toast confirmation

**3. macOS-style controls on all tool popups**

Currently only the EnamelCostDialog has the macOS floating window. The other tools (Imperial, Circle) open via `window.open()` as separate browser windows — they don't have custom controls.

- Since `window.open()` popups already have native OS chrome, the macOS-style controls should apply to the **ToolPage.tsx** wrapper that renders inside those popups
- Add a reusable `FloatingWindowBar` component with the red/yellow/green traffic light buttons that calls `window.close()`, minimizes, and toggles fullscreen
- Apply this bar to `ToolPage.tsx` for all standalone tool windows

**4. Remove "Finitura" and "Smalto" from Tools page**

- Remove entries with `id: "finish"` and `id: "enamel"` from the `tools` array in `Tools.tsx`
- Remove `finish` and `enamel` cases from `ToolPage.tsx`
- Keep the component files in case they're used elsewhere (EnamelCostCalculator is used in quotes)

### Files to modify

| File | Change |
|---|---|
| `src/pages/Tools.tsx` | Remove "finish" and "enamel" entries |
| `src/pages/ToolPage.tsx` | Remove finish/enamel cases, add macOS title bar |
| `src/pages/NewQuote.tsx` | Per-section enamel state, move button to section actions |
| `src/components/EnamelCostCalculator.tsx` | Add copy button on TOT. RIGA |
| `src/components/EnamelCostDialog.tsx` | Minor: accept section name for title |
| `src/hooks/usePdfGenerator.ts` | Update for per-section enamel map |
| `src/pages/Quotes.tsx` | Update enamel data format handling |
| `src/components/MacWindowBar.tsx` | New reusable macOS title bar component |

