import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, TrendingUp, Bot, Layers, Search, BarChart3, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { catalog, projects } from '@/services/api'

export default function CatalogPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    Promise.allSettled([
      catalog.list().then(d => setItems(d.products || [])).catch(() => {}),
      catalog.stats().then(setStats).catch(() => {}),
    ])
  }, [])

  const filtered = items.filter(p => !q || p.keyword?.toLowerCase().includes(q.toLowerCase()) || p.product_title?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <h1 className="font-bold text-lg">Product Catalog & Analytics</h1>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products', value: stats.total_products || 0, icon: Package },
              { label: 'Funnels Built', value: stats.total_funnels || 0, icon: Layers },
              { label: 'Chat Sessions', value: stats.total_chats || 0, icon: Bot },
              { label: 'Revenue Events', value: stats.total_events || 0, icon: TrendingUp },
            ].map(s => (
              <Card key={s.label} className="bg-white/5 border-white/10">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <s.icon className="w-4 h-4 text-white/30" />
                    <span className="text-2xl font-bold">{s.value}</span>
                  </div>
                  <p className="text-white/50 text-sm">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search products..."
            className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-white/30"
          />
        </div>

        {/* Product Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No products yet. Start a project from the dashboard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p: any) => (
              <Card key={p.id} className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{p.keyword}</p>
                        {p.product_title && <p className="text-white/50 text-sm">{p.product_title}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          {p.best_uvz && <Badge variant="outline" className="text-xs border-white/15 text-white/40 max-w-xs truncate">{p.best_uvz.slice(0, 60)}...</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-white" onClick={() => navigate(`/project/${p.project_id || p.id}`)}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
