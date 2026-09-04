# Zoho CRM agent setup

`zoho-project-draft` imports a Deal and related Quotes, Notes and Attachments metadata, then returns a technical dossier. It never writes to CRM or WorkDrive.

Backend secrets: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, optional `ZOHO_ACCOUNTS_URL`, optional `ZOHO_API_DOMAIN`, and `ZOHO_WORKDRIVE_PARENT_FOLDER_ID`.

Telegram secrets: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. The token must remain in Supabase secrets and must never be exposed to the browser or committed to GitHub. The completion notification explicitly states that the Zoho status remains `Richiesta`.

Minimum authorization: read access to Deals, Quotes, Notes and Attachments. WorkDrive scopes must be added separately before enabling writes.

Agent tool: `import_zoho_project_draft`. Use a non-production Deal for the first integration test.
