import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'MASTER_QA_LAUNCH_AUDIT.md',
  'PROMOTION_READINESS_PLAN.md',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/static/favicon.svg',
  'src/pages/TrustPage.tsx',
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing launch files: ${missing.join(', ')}`);
  process.exit(1);
}

const dashboard = readFileSync('src/pages/Dashboard.tsx', 'utf8');
if (dashboard.includes('ready to deploy on Whop') || dashboard.includes('All fire in sequence')) {
  console.error('Dashboard still contains overclaim launch copy.');
  process.exit(1);
}

console.log('Launch smoke checks passed.');
