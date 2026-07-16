# Deployment

Use isolated preview and production resources, secrets, domains, databases, and storage. Verify build, migrations, smoke tests, health checks, and rollback before promotion. This readiness workflow does not deploy or change DNS.

## Rollback

Redeploy the last verified artifact and apply only migrations explicitly documented as backward compatible. Never delete production data or resources as an automated rollback step.
