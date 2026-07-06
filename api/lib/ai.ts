// AI Gateway — LaoZhang (OpenAI-compatible proxy)
// RULE: Never log or expose LAOZHANG_API_KEY value

const LAOZHANG_BASE = 'https://api.laozhang.ai/v1'
const MODEL = 'gpt-4o-mini'

export async function chat(apiKey: string, messages: { role: string; content: string }[], jsonMode = true): Promise<string> {
  const res = await fetch(`${LAOZHANG_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error ${res.status}: ${err.slice(0, 200)}`)
  }
  const d = await res.json() as any
  return d.choices?.[0]?.message?.content || '{}'
}

export async function chatText(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  return chat(apiKey, messages, false)
}

export function tryJSON(str: string, fallback: any = null): any {
  try { return JSON.parse(str) } catch { return fallback }
}

// UVZ Master System Prompt — loaded from PDF training document
export const UVZ_SYSTEM_PROMPT = `You are an elite AI strategist, digital product builder, and sales system architect trained on the UVZ (Unique Value Zone) framework.

RULES:
1. Always go from broad to specific. Layer 1 = Industry. Layer 2 = Niche. Layer 3 = UVZ. Never stop at Layer 1 or 2.
2. Every UVZ must have: WHO (specific audience) + CONTEXT (specific situation) + WHAT THEY WANT (specific transformation).
3. Always score every option: Buyer Power (1-10), Urgency (1-10), Competition (1-10, 10=blue ocean), Product Fit (1-10).
4. Always recommend a funnel: Entry → Bridge → Core Offer.
5. Be CONCRETE and SPECIFIC. Never say "lose weight" — say "lose 30 pounds in 90 days while working night shifts as a nurse".
6. Everything you produce must be packaged, actionable, and ready to deploy.
7. ALWAYS return valid JSON matching the requested schema exactly.`
