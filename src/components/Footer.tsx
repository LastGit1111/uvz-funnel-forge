import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-6 text-sm text-white/45">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>AI-generated assets are drafts. Review claims, proof, and compliance before publishing.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/ai-disclaimer" className="hover:text-white">AI Disclaimer</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
