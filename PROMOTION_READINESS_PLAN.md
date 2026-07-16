# UVZ Funnel Forge - Promotion Readiness Plan

## What The App Does

UVZ Funnel Forge turns a keyword into a structured digital product system. It creates a project, runs AI modules for UVZ selection, product packaging, light tool design, chatbot setup, course pack generation, funnel copy, and catalog analytics. It runs on Cloudflare Pages with a Hono worker and Cloudflare D1.

## What Is Ready

- React dashboard for creating keyword projects.
- Hono API worker with project, auth, module, catalog, and NOVA routes.
- D1 schema for projects, users, UVZ analyses, products, funnels, conversations, analytics, and ingests.
- AI generation through LaoZhang/OpenAI-compatible `gpt-4o-mini`.
- Seven module endpoints:
  - UVZ Analyzer
  - Product Generator
  - Light Tool Builder
  - AI Chatbot Advisor
  - Course Pack Maker
  - Funnel Builder
  - Catalog and Analytics
- NOVA Brain endpoints: `/health`, `/api/status`, `/api/info`, `/api/ingest`.
- Frontend display now matches backend response shapes for chatbot, course, funnel, and catalog project navigation.
- Prompt rules now avoid invented proof, testimonials, revenue claims, and unsafe promotion claims.

## Must Configure Before Public Use

- `LAOZHANG_API_KEY`
- `JWT_SECRET`
- Cloudflare D1 binding `DB`
- Cloudflare Pages project `uvz-funnel-forge`

## Do Not Overclaim Yet

- Generated sales proof is only a placeholder unless supplied by the user.
- Analytics counts product events, chat sessions, funnels, and products. It is not yet a full revenue attribution system.
- The light tools are generated configurations, not fully hosted standalone calculators/quizzes with public share URLs yet.
- Auth exists, but the main dashboard still behaves as a lightweight/guest-first app.
- Generated Whop listings are drafts. A human should verify compliance, claims, pricing, and proof before publishing.

## Launch Checklist

1. Apply D1 migrations.
2. Set `LAOZHANG_API_KEY` and `JWT_SECRET` in Cloudflare.
3. Deploy to Cloudflare Pages.
4. Test `/health`, `/api/status`, `/api/info`, and `/api/ingest`.
5. Create a project from a keyword.
6. Run all seven modules in order.
7. Refresh the project page and verify generated outputs remain visible.
8. Open Catalog and confirm products link back to project pages.
9. Test chatbot configure and chat.
10. Review generated copy for proof, compliance, and claim safety.
11. Add export/share features for generated tools and Whop listings before paid customer acquisition.

## Promotion Positioning

Best safe positioning right now:

"An AI digital product factory that turns a keyword into a UVZ, offer, product outline, tool concept, chatbot prompt, course pack, funnel copy, and catalog record in one workflow."

## Enhanced Master Prompt

Use this as the public product-generation prompt frame:

```text
You are an ethical digital product strategist. Turn the keyword into a complete, launch-ready digital product system.

Rules:
- Move from broad market to niche to ultra-specific UVZ.
- Every UVZ must include WHO, CONTEXT, and TRANSFORMATION.
- Score each option on buyer power, urgency, competition, and product fit.
- Package the winner into a product people can understand and buy.
- Generate a light tool that gives value before the sale.
- Create chatbot, course, funnel, email, and Whop listing drafts.
- Do not invent testimonials, revenue claims, credentials, scarcity, medical/legal guarantees, or customer proof.
- If proof is needed, use a clear placeholder such as: "Add verified customer result here."
- Return structured JSON that the app can render directly.
```

