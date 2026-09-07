# Zoho CRM agent setup

`zoho-project-draft` legge una Quotation e i relativi Deal, note e allegati. Crea una cartella progetto WorkDrive con `CAD`, `PDF` e `REPORT`, copia gli allegati e genera un report Word modificabile. Non modifica costi o stato Zoho.

Backend secrets: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_WORKDRIVE_PARENT_FOLDER_ID`, `ZOHO_WEBHOOK_TOKEN`, optional `ZOHO_ACCOUNTS_URL`, and optional `ZOHO_API_DOMAIN`.

Telegram secrets: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. The token must remain in Supabase secrets and must never be exposed to the browser or committed to GitHub. The completion notification explicitly states that the Zoho status remains `Richiesta`.

Required authorization: read access to Deals, Quotes, Notes and Attachments plus WorkDrive folder/file create and upload scopes.

Configure two Zoho workflows to POST the quotation ID with header `x-zoho-webhook-token`: one when `Quote_Stage` becomes `Budget Quote Richiesta`, and one for a mention with `trigger=mention` and the mention text. Repeated runs reuse folders and overwrite same-name files.
