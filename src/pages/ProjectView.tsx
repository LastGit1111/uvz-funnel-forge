import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Package, Zap, Bot, BookOpen, Layers, BarChart3, Loader2, CheckCircle, ChevronRight, Copy, ExternalLink, Sparkles, RefreshCw, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { projects, uvz, product, tools, chatbot, course, funnel } from '@/services/api'

const TABS = [
  { id: 'uvz', label: 'UVZ Analyzer', icon: Search },
  { id: 'product', label: 'Product', icon: Package },
  { id: 'tools', label: 'Light Tool', icon: Zap },
  { id: 'chatbot', label: 'Chatbot', icon: Bot },
  { id: 'course', label: 'Course Pack', icon: BookOpen },
  { id: 'funnel', label: 'Funnel', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function CopyBtn({ text }: { text: string }) {
  const { toast } = useToast()
  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-white/40 hover:text-white"
      onClick={() => { navigator.clipboard.writeText(text); toast({ title: 'Copied!' }) }}>
      <Copy className="w-3.5 h-3.5" />
    </Button>
  )
}

function ScoreTable({ options }: { options: any[] }) {
  if (!options?.length) return null
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 pr-4 text-white/50 font-medium">#</th>
            <th className="text-left py-2 pr-4 text-white/50 font-medium">UVZ Option</th>
            <th className="text-center py-2 px-2 text-white/50 font-medium">Buyer Power</th>
            <th className="text-center py-2 px-2 text-white/50 font-medium">Urgency</th>
            <th className="text-center py-2 px-2 text-white/50 font-medium">Competition</th>
            <th className="text-center py-2 px-2 text-white/50 font-medium">Product Fit</th>
            <th className="text-center py-2 px-2 text-white/50 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o: any, i: number) => {
            const total = (o.scores?.buyer_power || 0) + (o.scores?.urgency || 0) + (o.scores?.competition || 0) + (o.scores?.product_fit || 0)
            const isTop = total === Math.max(...options.map((x: any) => (x.scores?.buyer_power || 0) + (x.scores?.urgency || 0) + (x.scores?.competition || 0) + (x.scores?.product_fit || 0)))
            return (
              <tr key={i} className={`border-b border-white/5 ${isTop ? 'bg-violet-500/10' : ''}`}>
                <td className="py-2 pr-4 text-white/40">{i + 1}</td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    {isTop && <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span className={isTop ? 'text-white font-medium' : 'text-white/70'}>{o.uvz_text}</span>
                  </div>
                </td>
                {['buyer_power', 'urgency', 'competition', 'product_fit'].map(k => (
                  <td key={k} className="text-center py-2 px-2">
                    <span className={`inline-block w-8 h-7 rounded-md text-xs font-bold flex items-center justify-center ${
                      (o.scores?.[k] || 0) >= 8 ? 'bg-emerald-500/20 text-emerald-300' :
                      (o.scores?.[k] || 0) >= 6 ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'}`}>
                      {o.scores?.[k] || '—'}
                    </span>
                  </td>
                ))}
                <td className="text-center py-2 px-2 font-bold text-white">{total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ModuleCard({ title, children, onRun, running, done }: { title: string, children: React.ReactNode, onRun?: () => void, running?: boolean, done?: boolean }) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {done && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {title}
          </CardTitle>
          {onRun && (
            <Button size="sm" disabled={running} onClick={onRun}
              className="h-8 bg-violet-600 hover:bg-violet-500 text-xs">
              {running ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Running...</> :
                done ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate</> :
                  <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate</>}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function TextBlock({ label, text }: { label: string, text: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</span>
        <CopyBtn text={text} />
      </div>
      <p className="text-white/80 text-sm leading-relaxed bg-white/5 rounded-xl p-4 whitespace-pre-wrap">{text}</p>
    </div>
  )
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [tab, setTab] = useState('uvz')
  const [uvzData, setUvzData] = useState<any>(null)
  const [productData, setProductData] = useState<any>(null)
  const [toolData, setToolData] = useState<any>(null)
  const [chatbotData, setChatbotData] = useState<any>(null)
  const [courseData, setCourseData] = useState<any>(null)
  const [funnelData, setFunnelData] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const sessionId = id + '-demo'

  useEffect(() => { if (id) loadProject() }, [id])

  const loadProject = async () => {
    try {
      const p = await projects.get(id!)
      setProject(p.project)
      // Load all existing module data
      await Promise.allSettled([
        uvz.get(id!).then(setUvzData).catch(() => {}),
        product.get(id!).then(setProductData).catch(() => {}),
        tools.get(id!).then(setToolData).catch(() => {}),
        chatbot.get(id!).then(setChatbotData).catch(() => {}),
        course.get(id!).then(setCourseData).catch(() => {}),
        funnel.get(id!).then(setFunnelData).catch(() => {}),
      ])
    } catch (e: any) {
      toast({ title: 'Failed to load project', description: e.message, variant: 'destructive' })
    }
  }

  const run = async (module: string, fn: () => Promise<any>, setter: (d: any) => void) => {
    setLoading(module)
    try {
      const d = await fn()
      setter(d)
      toast({ title: `${module} complete ✓` })
    } catch (e: any) {
      toast({ title: `${module} failed`, description: e.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', content: msg }])
    setChatLoading(true)
    try {
      const productId = productData?.product?.id || id
      const res = await chatbot.chat(productId, msg, sessionId)
      setChatMessages(m => [...m, { role: 'assistant', content: res.reply || res.message || 'Got it!' }])
    } catch {
      setChatMessages(m => [...m, { role: 'assistant', content: 'I had trouble connecting. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!project) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  )

  const kw = project.keyword || 'your keyword'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div>
              <h1 className="font-bold capitalize">{kw}</h1>
              <p className="text-xs text-white/40">{project.id}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${project.status === 'complete' ? 'border-emerald-500/40 text-emerald-300' : 'border-amber-500/40 text-amber-300'}`}>
            {project.status}
          </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-8 flex flex-wrap gap-1 h-auto">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white text-white/50 hover:text-white flex items-center gap-1.5 px-3 py-2">
                <t.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── M1: UVZ Analyzer ─────────────────────────────────────────── */}
          <TabsContent value="uvz">
            <ModuleCard
              title="Module 1 — UVZ Analyzer"
              onRun={() => run('UVZ Analyzer', () => uvz.analyze(id!, kw), setUvzData)}
              running={loading === 'UVZ Analyzer'}
              done={!!uvzData?.analysis}
            >
              {!uvzData?.analysis ? (
                <div className="text-center py-12 text-white/40">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Click Generate to analyze "{kw}" and get 10 scored UVZ options</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-white/40 mb-1">Layer 1 — Industry</p>
                      <p className="font-semibold">{uvzData.analysis.layer1}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-white/40 mb-1">Layer 2 — Niche</p>
                      <p className="font-semibold">{uvzData.analysis.layer2}</p>
                    </div>
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
                      <p className="text-xs text-violet-300/60 mb-1">Best UVZ Selected</p>
                      <p className="font-semibold text-violet-200 text-sm">{uvzData.analysis.selected_uvz}</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white/60 mb-3">All 10 UVZ Options — Scoring Table</h4>
                  <ScoreTable options={uvzData.analysis.options || []} />
                  {uvzData.analysis.selection_reason && (
                    <div className="mt-4 bg-violet-500/10 rounded-xl p-4 border border-violet-500/20">
                      <p className="text-xs text-violet-300/60 mb-1">Why This UVZ Wins</p>
                      <p className="text-white/80 text-sm">{uvzData.analysis.selection_reason}</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => setTab('product')}>
                      Next: Product Generator <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </ModuleCard>
          </TabsContent>

          {/* ── M2: Product Generator ─────────────────────────────────────── */}
          <TabsContent value="product">
            <ModuleCard
              title="Module 2 — Product Format Generator"
              onRun={() => run('Product Generator', () => product.generate(id!, uvzData?.analysis?.selected_uvz || kw), setProductData)}
              running={loading === 'Product Generator'}
              done={!!productData?.product}
            >
              {!uvzData?.analysis && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                  <p className="text-amber-300 text-sm">⚠️ Run UVZ Analyzer first to get the selected UVZ</p>
                </div>
              )}
              {!productData?.product ? (
                <div className="text-center py-12 text-white/40">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Generate a product title, outline, format & price recommendation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-white/40 mb-1">Product Title</p>
                        <h3 className="text-lg font-bold text-white">{productData.product.title}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="border-violet-500/40 text-violet-300">{productData.product.format}</Badge>
                          <span className="text-emerald-300 font-semibold">${productData.product.price_low}–${productData.product.price_high}</span>
                        </div>
                      </div>
                      <CopyBtn text={productData.product.title} />
                    </div>
                  </div>
                  {productData.product.outline && (
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Product Outline</p>
                      <div className="space-y-2">
                        {(Array.isArray(productData.product.outline) ? productData.product.outline : []).map((section: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                            <span className="text-xs font-bold text-violet-400 w-6 shrink-0">M{i + 1}</span>
                            <p className="text-white/75 text-sm">{section}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {productData.product.transformation && (
                    <TextBlock label="Transformation Promise" text={productData.product.transformation} />
                  )}
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => setTab('tools')}>
                    Next: Light Tool Builder <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </ModuleCard>
          </TabsContent>

          {/* ── M3: Light Tool Builder ────────────────────────────────────── */}
          <TabsContent value="tools">
            <ModuleCard
              title="Module 3 — Light Tool Builder"
              onRun={() => run('Light Tool', () => tools.build(id!, productData?.product?.recommended_tool_type || 'calculator', { uvz: uvzData?.analysis?.selected_uvz || kw, product_title: productData?.product?.title || kw }), setToolData)}
              running={loading === 'Light Tool'}
              done={!!toolData?.tool}
            >
              {!productData?.product && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
                  <p className="text-amber-300 text-sm">⚠️ Complete Product Generator first</p>
                </div>
              )}
              {!toolData?.tool ? (
                <div className="text-center py-12 text-white/40">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Build a Calculator, Quiz, Planner, Tracker, or Generator</p>
                  <p className="text-xs mt-2">5 base templates — infinite configurations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{toolData.tool.name}</p>
                      <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-300 mt-1 capitalize">{toolData.tool.type}</Badge>
                    </div>
                  </div>
                  {toolData.tool.description && <TextBlock label="Tool Description" text={toolData.tool.description} />}
                  {toolData.tool.questions && (
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Tool Questions / Fields</p>
                      <div className="space-y-1.5">
                        {(Array.isArray(toolData.tool.questions) ? toolData.tool.questions : []).map((q: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-lg px-4 py-2.5 text-sm text-white/75">
                            {i + 1}. {typeof q === 'string' ? q : q.question || q.label || JSON.stringify(q)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {toolData.tool.result_template && <TextBlock label="Result Template" text={toolData.tool.result_template} />}
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => setTab('chatbot')}>
                    Next: AI Chatbot <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </ModuleCard>
          </TabsContent>

          {/* ── M4: Chatbot ───────────────────────────────────────────────── */}
          <TabsContent value="chatbot">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModuleCard
                title="Module 4 — AI Chatbot Config"
                onRun={() => run('Chatbot Config', () => chatbot.configure(id!, productData?.product?.persona || 'advisor', productData?.product?.title || kw), setChatbotData)}
                running={loading === 'Chatbot Config'}
                done={!!chatbotData?.chatbot}
              >
                {!chatbotData?.chatbot ? (
                  <div className="text-center py-8 text-white/40">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Generate persona, system prompt & upsell scripts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatbotData.chatbot.persona_name && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/40 mb-1">AI Persona</p>
                        <p className="font-semibold">{chatbotData.chatbot.persona_name}</p>
                        {chatbotData.chatbot.persona_description && <p className="text-white/60 text-xs mt-1">{chatbotData.chatbot.persona_description}</p>}
                      </div>
                    )}
                    {chatbotData.chatbot.system_prompt && <TextBlock label="System Prompt" text={chatbotData.chatbot.system_prompt} />}
                    {chatbotData.chatbot.upsell_short && <TextBlock label="Short Upsell (1 sentence)" text={chatbotData.chatbot.upsell_short} />}
                    {chatbotData.chatbot.upsell_medium && <TextBlock label="Medium Upsell (3 sentences)" text={chatbotData.chatbot.upsell_medium} />}
                  </div>
                )}
              </ModuleCard>

              {/* Live Chat Demo */}
              <Card className="bg-white/5 border-white/10 flex flex-col h-[500px]">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    Live Chat Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                    {chatMessages.length === 0 && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="bg-white/5 rounded-2xl rounded-tl-sm p-3 text-sm text-white/70 max-w-xs">
                          {chatbotData?.chatbot?.greeting || `Hey! 👋 I'm your AI advisor for "${kw}". Ask me anything!`}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-violet-500/20' : 'bg-emerald-500/20'}`}>
                          {m.role === 'user' ? '👤' : <Bot className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className={`rounded-2xl p-3 text-sm max-w-xs ${m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white/5 text-white/70 rounded-tl-sm'}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Ask the AI advisor..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
                    />
                    <Button size="sm" onClick={sendChat} disabled={chatLoading} className="bg-violet-600 hover:bg-violet-500 rounded-xl px-4">
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── M5: Course Pack ───────────────────────────────────────────── */}
          <TabsContent value="course">
            <ModuleCard
              title="Module 5 — Course Pack Maker"
              onRun={() => run('Course Pack', () => course.generate(id!), setCourseData)}
              running={loading === 'Course Pack'}
              done={!!courseData?.course}
            >
              {!courseData?.course ? (
                <div className="text-center py-12 text-white/40">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Convert product outline into full course scripts, slides & worksheets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseData.course.modules && (
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Course Modules</p>
                      <div className="space-y-3">
                        {(Array.isArray(courseData.course.modules) ? courseData.course.modules : []).map((m: any, i: number) => (
                          <Card key={i} className="bg-white/5 border-white/10">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-sm">Module {i + 1}: {m.title}</p>
                                  {m.duration && <p className="text-white/40 text-xs mt-0.5">~{m.duration}</p>}
                                </div>
                                <CopyBtn text={m.script || m.title} />
                              </div>
                              {m.script && <p className="text-white/65 text-xs mt-3 leading-relaxed">{m.script.slice(0, 200)}...</p>}
                              {m.worksheet && (
                                <div className="mt-3 bg-white/5 rounded-lg p-3">
                                  <p className="text-xs text-white/40 mb-1">Worksheet</p>
                                  <p className="text-white/60 text-xs">{m.worksheet}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModuleCard>
          </TabsContent>

          {/* ── M6: Funnel Builder ────────────────────────────────────────── */}
          <TabsContent value="funnel">
            <ModuleCard
              title="Module 6 — Funnel Builder"
              onRun={() => run('Funnel Builder', () => funnel.build(id!), setFunnelData)}
              running={loading === 'Funnel Builder'}
              done={!!funnelData?.funnel}
            >
              {!funnelData?.funnel ? (
                <div className="text-center py-12 text-white/40">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Generate landing page copy, email sequence, hooks & full funnel path</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* 3 Angle Offers */}
                  {funnelData.funnel.offers && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['pain', 'dream', 'enemy'].map(angle => (
                        <div key={angle} className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize border-white/20 text-white/60">{angle} Angle</Badge>
                          </div>
                          <p className="text-white/80 text-sm font-medium">{funnelData.funnel.offers?.[`${angle}_headline`]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Funnel Path */}
                  {funnelData.funnel.entry_offer && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Entry Offer', key: 'entry_offer', color: 'border-emerald-500/30 bg-emerald-500/5' },
                        { label: 'Bridge', key: 'bridge', color: 'border-blue-500/30 bg-blue-500/5' },
                        { label: 'Core Offer', key: 'core_offer', color: 'border-violet-500/30 bg-violet-500/5' },
                      ].map(f => (
                        <div key={f.key} className={`rounded-xl p-4 border ${f.color}`}>
                          <p className="text-xs font-semibold text-white/40 mb-2">{f.label}</p>
                          <p className="text-white/80 text-sm">{funnelData.funnel[f.key]}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Hooks */}
                  {funnelData.funnel.hooks && (
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">5 Hook Options</p>
                      <div className="space-y-2">
                        {(Array.isArray(funnelData.funnel.hooks) ? funnelData.funnel.hooks : []).map((h: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                            <span className="text-xs font-bold text-violet-400 w-5 shrink-0">H{i + 1}</span>
                            <p className="text-white/75 text-sm flex-1">{h}</p>
                            <CopyBtn text={h} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Email Sequence */}
                  {funnelData.funnel.email_sequence && (
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Email Sequence</p>
                      <div className="space-y-2">
                        {(Array.isArray(funnelData.funnel.email_sequence) ? funnelData.funnel.email_sequence : []).map((e: any, i: number) => (
                          <div key={i} className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs font-semibold text-white/60">Email {i + 1} — {e.subject || e.title}</p>
                              <CopyBtn text={e.body || e.subject} />
                            </div>
                            {e.body && <p className="text-white/65 text-xs leading-relaxed">{e.body.slice(0, 150)}...</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModuleCard>
          </TabsContent>

          {/* ── M7: Analytics ─────────────────────────────────────────────── */}
          <TabsContent value="analytics">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Module 7 — Catalog & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Module Completions', value: [uvzData, productData, toolData, chatbotData, courseData, funnelData].filter(Boolean).length, max: 6 },
                    { label: 'UVZ Status', value: uvzData?.analysis ? '✅ Done' : '⏳ Pending' },
                    { label: 'Funnel Status', value: funnelData?.funnel ? '✅ Done' : '⏳ Pending' },
                    { label: 'Chatbot Status', value: chatbotData?.chatbot ? '✅ Done' : '⏳ Pending' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-4">
                      <p className="text-2xl font-bold">{s.value}{s.max ? `/${s.max}` : ''}</p>
                      <p className="text-white/40 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-xl p-5 text-center">
                  <Button className="bg-violet-600 hover:bg-violet-500 mb-3" onClick={() => window.open('/catalog', '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View Full Catalog Dashboard
                  </Button>
                  <p className="text-white/40 text-xs">All products, sales, chatbot conversions & traffic in one place</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
