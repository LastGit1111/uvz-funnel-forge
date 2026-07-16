#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2); const output = args.includes('--output') ? args[args.indexOf('--output') + 1] : '.ecco/readiness-report.json';
const run = (cmd, a) => { try { return execFileSync(cmd, a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
const pkg = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'))) : null;
const files = [];
const walk = (dir) => { for (const entry of readdirSync(dir, { withFileTypes: true })) { if (['node_modules','.git','dist','.wrangler'].includes(entry.name)) continue; const p=join(dir,entry.name); if(entry.isDirectory()) walk(p); else if(/\.(?:[cm]?[jt]sx?|jsonc?|md)$/i.test(entry.name)) files.push(p); } };
walk(root);
const text = files.slice(0, 2500).map(p => { try { return readFileSync(p,'utf8'); } catch { return ''; } }).join('\n');
const match = (re) => re.test(text);
const scripts = pkg?.scripts ?? {};
const manifestPath=join(root,'.ecco','app.manifest.json'); const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath)):null;
const checks = { packageManager: existsSync(join(root,'pnpm-lock.yaml'))?'pnpm':existsSync(join(root,'yarn.lock'))?'yarn':existsSync(join(root,'package-lock.json'))?'npm':'unknown', installStatus: existsSync(join(root,'node_modules')), framework: match(/hono/i)?'Hono':match(/react|tanstack/i)?'React/TanStack':'unknown', routes: [...text.matchAll(/(?:app|router)\.(?:get|post|put|delete|all)\(\s*['"`]([^'"`]+)/g)].map(x=>x[1]).slice(0,200), hono:match(/from ['"]hono|new Hono/), d1:match(/\bD1Database\b|\.prepare\(/), r2:match(/\bR2Bucket\b|\.put\(/), migrations: files.some(p=>/migrations/.test(p)), scripts: Object.fromEntries(['build','test','lint','typecheck','check'].map(k=>[k,Boolean(scripts[k])])), security: { corsAllowlist: match(/Access-Control-Allow-Origin|cors\(/), csp: match(/content-security-policy|Content-Security-Policy/i), api404: match(/404|not found/i), piiRisk: match(/email|phone|address/i) }, providers: [...new Set((text.match(/(?:stripe|whop|suno|kie\.ai|openai|anthropic)/gi)||[]).map(x=>x.toLowerCase()))], mockRisk: match(/\b(mock|demo|placeholder|random|fake|simulat)/i), hardcodedDomains: [...new Set(text.match(/https?:\/\/[^\s'"`)<]+/g)||[])].slice(0,100), requiredSecrets: manifest?.requiredSecrets ?? [] };
const blockers=[]; if(!pkg) blockers.push('No package.json detected'); if(!checks.scripts.build) blockers.push('No build script detected'); if(checks.mockRisk) blockers.push('Mock/demo/placeholder language requires product-truth review'); if(!checks.security.csp) blockers.push('CSP evidence not detected');
const report={repository:{name:pkg?.name ?? root.split(/[\\/]/).pop(),root,branch:run('git',['branch','--show-current']),commit:run('git',['rev-parse','HEAD'])},checkedAt:new Date().toISOString(),normalizedStatus:blockers.length?'CODE_INCOMPLETE':'BUILD_PASSING',manifest,checks,blockers,readOnly:true};
mkdirSync(resolve(root, output, '..'),{recursive:true}); writeFileSync(resolve(root,output),JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report,null,2));
