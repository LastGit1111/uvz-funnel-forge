import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'UVZ Funnel Forge stores account details, project keywords, generated outputs, conversations, analytics events, and progress records so users can build and retrieve product systems.',
      'The app uses Cloudflare infrastructure and an OpenAI-compatible AI provider when generation features are enabled.',
      'Users can request data export or deletion by contacting support.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'UVZ Funnel Forge creates draft product, course, chatbot, and funnel assets. You are responsible for reviewing outputs before publishing or selling them.',
      'Do not use the service to generate unlawful, misleading, infringing, or harmful content.',
      'Generated copy is not legal, medical, financial, or professional advice.',
    ],
  },
  'ai-disclaimer': {
    title: 'AI Output Disclaimer',
    body: [
      'AI output may be incomplete, inaccurate, or unsuitable for regulated advertising without human review.',
      'The system is instructed not to invent testimonials, revenue claims, credentials, scarcity, or customer proof.',
      'Any proof, testimonials, screenshots, or performance claims must come from verified user-provided sources.',
    ],
  },
  contact: {
    title: 'Contact & Support',
    body: [
      'For support, data requests, partnerships, or launch questions, contact: support@uvzfunnelforge.app.',
      'For AI output compliance, review every generated asset before publication and keep proof records for all claims.',
    ],
  },
};

export default function TrustPage() {
  const { page = 'privacy' } = useParams();
  const content = CONTENT[page] || CONTENT.privacy;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/">
          <Button variant="ghost" className="mb-6 text-white/60 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-white/45">UVZ Funnel Forge</p>
            <h1 className="text-3xl font-bold">{content.title}</h1>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 leading-relaxed text-white/75">
          {content.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="text-sm text-white/40">Last updated: July 16, 2026.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
