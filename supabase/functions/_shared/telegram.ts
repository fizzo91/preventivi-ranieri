export async function sendTelegramCompletion(input: {
  dealName: string
  quoteSubject: string
  dossierConfidence: string
  workdriveUrl?: string | null
}) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID")
  if (!token || !chatId) return { sent: false, reason: "not_configured" }

  const lines = [
    "✅ Agente quotation: report completato",
    input.dealName || input.quoteSubject,
    `Report: completato (${input.dossierConfidence})`,
    "Stato Zoho invariato: Richiesta",
  ]
  if (input.workdriveUrl) lines.push(`WorkDrive: ${input.workdriveUrl}`)

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.ok) throw new Error(payload.description ?? "Telegram notification failed")
  return { sent: true, messageId: payload.result?.message_id ?? null }
}
