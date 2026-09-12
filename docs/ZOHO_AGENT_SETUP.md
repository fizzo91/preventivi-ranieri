# Zoho CRM agent setup

`zoho-project-draft` imports a Deal and related Quotes and Notes. It discovers attachments on the Deal, Quotation and each individual Note, downloads the file bytes from Zoho, stages them in the private `zoho-agent-files` Storage bucket and returns short-lived signed URLs in the technical dossier. It does not modify CRM records. In WorkDrive it creates or reuses one project folder and the `CAD`, `PDF` and `REPORT` subfolders.

Backend secrets: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, optional `ZOHO_ACCOUNTS_URL`, optional `ZOHO_API_DOMAIN`, optional `ZOHO_WORKDRIVE_API_DOMAIN`, and `ZOHO_WORKDRIVE_PARENT_FOLDER_ID`.

Telegram secrets: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. The token must remain in Supabase secrets and must never be exposed to the browser or committed to GitHub. The completion notification explicitly states that the Zoho status remains `Richiesta`.

Minimum authorization: read access to Deals, Quotes, Notes and Attachments, including `ZohoCRM.modules.attachments.READ`, plus `WorkDrive.files.READ` and `WorkDrive.files.CREATE`. The WorkDrive user must be an admin, organizer or editor of the destination Team Folder.

The attachment bucket is private. The Edge Function writes with `SUPABASE_SERVICE_ROLE_KEY`; the key stays server-side. Objects are namespaced by authenticated user and Deal ID. Signed URLs expire after one hour and are intended as the handoff to the technical-analysis agent.

Agent tool: `import_zoho_project_draft`. Pass both `deal_id` and `quote_id` when the monitor is reacting to a specific Quotation; without `quote_id`, the importer falls back to the most recently modified quotation in `Budget Quote Richiesta`. Use a non-production Deal for the first integration test.
