import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, BarChart3, BookOpen, Bot, Layers, Funnel, Plus, ArrowRight, TrendingUp, Package, Sparkles, ChevronRight, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { projects, catalog } from '@/services/api'
import Footer from '@/components/Footer'

const MODULES = [
  { id: 1, icon: Search, label: 'UVZ Analyzer', desc: 'Turn any keyword into 10 scored UVZ options', color: 'from-violet-500 to-purple-600' },
  { id: 2, icon: Package, label: 'Product Generator', desc: 'Generate title, outline & price recommendation', color: 'from-blue-500 to-cyan-600' },
  { id: 3, icon: Zap, label: 'Light Tool Builder', desc: 'Calculator, Quiz, Planner, Tracker, Generator', color: 'from-amber-500 to-orange-600' },
  { id: 4, icon: Bot, label: 'AI Chatbot Advisor', desc: '24/7 sales agent trained on your product', color: 'from-emerald-500 to-teal-600' },
  { id: 5, icon: BookOpen, label: 'Course Pack Maker', desc: 'Outline → full script, slides & worksheets', color: 'from-rose-500 to-pink-600' },
  { id: 6, icon: Layers, label: 'Funnel Builder', desc: 'Landing copy, email sequence, hook scripts', color: 'from-indigo-500 to-blue-600' },
  { id: 7, icon: BarChart3, label: 'Catalog & Analytics', desc: 'Dashboard for all products & conversions', color: 'from-gray-600 to-slate-700' },
]

export default function Dashboard() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
    inputRef.current?.focus()
  }, [])

  const loadData = async () => {
    try {
      const [proj, st] = await Promise.allSettled([projects.list(), catalog.stats()])
      if (proj.status === 'fulfilled') setRecentProjects(proj.value.projects?.slice(0, 6) || [])
      if (st.status === 'fulfilled') setStats(st.value)
    } catch {}
  }

  const handleStart = async () => {
    const kw = keyword.trim()
    if (!kw) return toast({ title: 'Enter a keyword', description: 'Type any niche, industry, or topic to begin', variant: 'destructive' })
    setLoading(true)
    try {
      const p = await projects.create(kw)
      navigate(`/project/${p.project.id}`)
    } catch (e: any) {
      toast({ title: 'Could not create project', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">UVZ Funnel Forge</h1>
              <p className="text-xs text-white/40 mt-0.5">AI Digital Product Factory</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" onClick={() => navigate('/catalog')}>
              <BarChart3 className="w-4 h-4 mr-1.5" /> Catalog
            </Button>
            <a href="https://nova-brain-orchestrator.shermanmonte1111.workers.dev/brain/apps" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <Brain className="w-4 h-4 mr-1.5" /> Brain
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            One keyword. One guided session. One complete product business draft.
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-none">
            Turn Any Keyword Into<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              a Digital Empire
            </span>
          </h2>
          <p className="text-white/50 text-xl max-w-2xl mx-auto mb-10">
            7 AI modules. UVZ analysis → product → tool → chatbot → course → funnel → catalog. 
            Scored, packaged, and ready for human review before publishing.
          </p>

          {/* Keyword Input */}
          <div className="max-w-xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <Input
                  ref={inputRef}
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="Enter any keyword — zodiac, keto, freelance, dog training..."
                  className="pl-12 h-14 text-base bg-white/5 border-white/15 text-white placeholder:text-white/30 rounded-2xl focus-visible:ring-violet-500"
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={loading}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-2xl font-semibold text-base"
              >
                {loading ? 'Starting...' : (
                  <><Zap className="w-5 h-5 mr-2" /> Forge It</>
                )}
              </Button>
            </div>
            <p className="text-white/30 text-sm mt-3">
              Try: "zodiac compatibility" · "perimenopause weight loss" · "delivery driver income" · "leash aggression"
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Products Built', value: stats.total_products || 0, icon: Package },
              { label: 'Funnels Live', value: stats.total_funnels || 0, icon: Layers },
              { label: 'Chat Sessions', value: stats.total_chats || 0, icon: Bot },
              { label: 'Total Events', value: stats.total_events || 0, icon: TrendingUp },
            ].map(s => (
              <Card key={s.label} className="bg-white/5 border-white/10">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="w-4 h-4 text-white/40" />
                    <span className="text-2xl font-bold">{s.value}</span>
                  </div>
                  <p className="text-white/50 text-sm">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* The 7 Modules */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">The 7 Modules</h3>
            <span className="text-white/40 text-sm">Run manually or use Run All inside a project</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((m) => (
              <Card key={m.id} className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors cursor-default group">
                <CardContent className="pt-5 pb-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white/30">M{m.id}</span>
                    <span className="font-semibold text-sm">{m.label}</span>
                  </div>
                  <p className="text-white/45 text-xs leading-relaxed">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
            {/* + padding card */}
            <Card className="bg-violet-500/5 border-violet-500/20 border-dashed flex items-center justify-center hover:bg-violet-500/10 transition-colors cursor-pointer" onClick={() => inputRef.current?.focus()}>
              <CardContent className="pt-5 pb-5 text-center">
                <Plus className="w-8 h-8 text-violet-400/60 mx-auto mb-3" />
                <p className="text-violet-300/60 text-sm font-medium">New Project</p>
                <p className="text-violet-300/40 text-xs mt-1">Enter a keyword above</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Recent Projects</h3>
              <Button variant="ghost" size="sm" className="text-white/40 hover:text-white" onClick={() => navigate('/catalog')}>
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((p: any) => (
                <Card
                  key={p.id}
                  className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold capitalize">{p.keyword}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs ${p.status === 'complete' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : p.status === 'analyzing' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}
                        variant="outline"
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[p.has_uvz, p.has_product, p.has_tool, p.has_chatbot, p.has_funnel].map((has, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${has ? 'bg-violet-400' : 'bg-white/15'}`} />
                        ))}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No projects state */}
        {recentProjects.length === 0 && (
          <div className="border border-white/10 rounded-2xl p-10 text-center">
            <Sparkles className="w-12 h-12 text-violet-400/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-white/40 text-sm mb-6">Type a keyword above and hit Forge It to create your first digital product system</p>
            <Button onClick={() => inputRef.current?.focus()} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="w-4 h-4 mr-2" /> Start First Project
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
