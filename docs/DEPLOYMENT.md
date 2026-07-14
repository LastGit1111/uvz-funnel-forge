# Production deployment

`uvz.thebesttrendingnow.com` is attached to the **production** deployment of
the Cloudflare Pages project `uvz-funnel-forge`.

Use this command to publish the application:

```bash
npm run deploy:production
```

It explicitly deploys to the Pages production branch (`main`). Do not run a
plain `wrangler pages deploy` from a feature branch for a production release:
Wrangler detects the current Git branch and creates a preview deployment.

After every production deployment, verify both endpoints:

```bash
curl -I https://uvz.thebesttrendingnow.com/
curl https://uvz.thebesttrendingnow.com/health
```

The page title must be `UVZ Funnel Forge — AI Digital Product Factory` and
the health response must identify `uvz-funnel-forge`. A 200 status alone is
not sufficient, because an older application can also return 200.

Use `npm run deploy:preview` only for a non-production Pages preview.
