# Production configuration

The application is deployed at `https://uvz.thebesttrendingnow.com` and uses Cloudflare Pages, D1, and R2.

Before enabling live accounts or an external ingest client, configure encrypted Pages secrets (never commit them):

```powershell
npx wrangler pages secret put JWT_SECRET --project-name uvz-funnel-forge
npx wrangler pages secret put INGEST_SECRET --project-name uvz-funnel-forge
npx wrangler pages secret put LAOZHANG_API_KEY --project-name uvz-funnel-forge
```

Create an account through the application, then grant its email the administrator role with a controlled D1 command:

```powershell
npx wrangler d1 execute uvz-funnel-db --remote --command "UPDATE users SET is_admin = 1 WHERE email = 'YOUR-ADMIN-EMAIL'"
```

The protected admin console is `/admin`. The ingest endpoint requires `Content-Type: application/json` and `X-Ingest-Key`. Keep email delivery, Whop webhook credentials, support contact details, and final legal review as separate production configuration work; those services are intentionally not fabricated by the application.
