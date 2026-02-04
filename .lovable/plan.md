

# Piano: Limitare Conversione Punto-Virgola ai Campi Numerici

## Panoramica
Modificheremo il componente Input per convertire il punto in virgola **solo** quando il campo ha `type="number"`.

## Situazione Attuale

Il componente attualmente converte il punto in virgola per **tutti** i tipi di input tranne email, password e URL. Questo causa problemi quando si scrive in campi di testo normali.

## Modifica

Cambieremo la condizione da:
```typescript
// PRIMA: converte per tutti tranne email, password, url
if (e.key === '.' && type !== 'email' && type !== 'password' && type !== 'url')
```

a:
```typescript
// DOPO: converte SOLO per type="number"
if (e.key === '.' && type === 'number')
```

## File da Modificare

| File | Azione | Descrizione |
|------|--------|-------------|
| `src/components/ui/input.tsx` | Modifica | Cambiare condizione nella funzione `handleKeyDown` |

## Risultato

- **Campi `type="number"`**: Il punto verrà convertito in virgola (formato italiano)
- **Tutti gli altri campi**: Il punto rimarrà punto

