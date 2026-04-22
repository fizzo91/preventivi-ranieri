/**
 * Error helpers — extract a human-readable message from any thrown value.
 * Replaces the `catch (e: any)` antipattern across the codebase.
 */

export function getErrorMessage(error: unknown, fallback = "Si è verificato un errore"): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message
    if (typeof msg === "string") return msg
  }
  return fallback
}
