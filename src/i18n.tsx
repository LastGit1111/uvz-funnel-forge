import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { locale as localeApi } from '@/services/api'

export type Locale = 'en' | 'nl' | 'es' | 'pap'

const copy: Record<Locale, Record<string, string>> = {
  en: {
    tagline: 'AI Digital Product Factory', login: 'Log in', catalog: 'Catalog', brain: 'Brain',
    heroBadge: 'One keyword. One session. One complete product business.', heroStart: 'Turn Any Keyword Into', heroEnd: 'a Digital Empire',
    heroDescription: '7 AI modules. UVZ analysis → product → tool → chatbot → course → funnel → catalog. Scored, packaged, and ready to deploy on Whop.',
    keywordPlaceholder: 'Enter any keyword — zodiac, keto, freelance, dog training...', forge: 'Forge It', starting: 'Starting...',
    tryExamples: 'Try: “zodiac compatibility” · “perimenopause weight loss” · “delivery driver income” · “leash aggression”',
    noTheme: 'No page theme', country: 'Country', place: 'Island or place', event: 'Event', zodiac: 'Zodiac sign', custom: 'Custom theme',
    themeHelp: 'Optional: guide the landing page with a location, event, zodiac, or custom visual theme.',
    productsBuilt: 'Products Built', funnelsLive: 'Funnels Live', chatSessions: 'Chat Sessions', totalEvents: 'Total Events',
    modules: 'The 7 Modules', moduleNote: 'All fire in sequence when you start a project', newProject: 'New Project', enterKeyword: 'Enter a keyword above',
    recentProjects: 'Recent Projects', viewAll: 'View all', noProjects: 'No projects yet', noProjectsText: 'Type a keyword above and hit Forge It to create your first digital product system', startFirst: 'Start First Project',
    analyzer: 'UVZ Analyzer', analyzerDesc: 'Turn any keyword into 10 scored UVZ options', productGenerator: 'Product Generator', productDesc: 'Generate title, outline & price recommendation',
    toolBuilder: 'Light Tool Builder', toolDesc: 'Calculator, Quiz, Planner, Tracker, Generator', advisor: 'AI Chatbot Advisor', advisorDesc: '24/7 sales agent trained on your product',
    courseMaker: 'Course Pack Maker', courseDesc: 'Outline → full script, slides & worksheets', funnelBuilder: 'Funnel Builder', funnelDesc: 'Landing copy, email sequence, hook scripts',
    analytics: 'Catalog & Analytics', analyticsDesc: 'Dashboard for all products & conversions', enterKeywordTitle: 'Enter a keyword', enterKeywordText: 'Type any niche, industry, or topic to begin',
    nameTheme: 'Name the theme', nameThemeText: 'Enter the {theme} you want the landing page to evoke.',
  },
  nl: {
    tagline: 'AI-fabriek voor digitale producten', login: 'Inloggen', catalog: 'Catalogus', brain: 'Brein',
    heroBadge: 'Eén zoekwoord. Eén sessie. Eén compleet productbedrijf.', heroStart: 'Maak van elk zoekwoord', heroEnd: 'een digitaal imperium',
    heroDescription: '7 AI-modules. UVZ-analyse → product → tool → chatbot → cursus → funnel → catalogus. Beoordeeld, verpakt en klaar voor Whop.',
    keywordPlaceholder: 'Voer een zoekwoord in — sterrenbeeld, keto, freelance, hondentraining...', forge: 'Start maken', starting: 'Bezig...',
    tryExamples: 'Probeer: “sterrenbeeld compatibiliteit” · “gewicht verliezen rond menopauze” · “inkomen bezorger” · “agressie aan de lijn”',
    noTheme: 'Geen paginathema', country: 'Land', place: 'Eiland of plaats', event: 'Evenement', zodiac: 'Sterrenbeeld', custom: 'Eigen thema',
    themeHelp: 'Optioneel: geef de landingspagina een locatie-, evenement-, sterrenbeeld- of eigen visueel thema.',
    productsBuilt: 'Producten gemaakt', funnelsLive: 'Funnels live', chatSessions: 'Chatsessies', totalEvents: 'Totaal gebeurtenissen',
    modules: 'De 7 modules', moduleNote: 'Ze starten allemaal achter elkaar wanneer je een project begint', newProject: 'Nieuw project', enterKeyword: 'Voer hierboven een zoekwoord in',
    recentProjects: 'Recente projecten', viewAll: 'Alles bekijken', noProjects: 'Nog geen projecten', noProjectsText: 'Voer hierboven een zoekwoord in en klik op Start maken om je eerste digitale productsysteem te maken', startFirst: 'Start eerste project',
    analyzer: 'UVZ-analyse', analyzerDesc: 'Maak van elk zoekwoord 10 beoordeelde UVZ-opties', productGenerator: 'Productgenerator', productDesc: 'Genereer titel, opzet en prijsadvies',
    toolBuilder: 'Lichte toolbouwer', toolDesc: 'Calculator, quiz, planner, tracker, generator', advisor: 'AI-chatbotadviseur', advisorDesc: '24/7 verkoopagent getraind op je product',
    courseMaker: 'Cursuspakketmaker', courseDesc: 'Opzet → volledig script, slides en werkbladen', funnelBuilder: 'Funnelbouwer', funnelDesc: 'Landingspagina, e-mailreeks en hooks',
    analytics: 'Catalogus en analyses', analyticsDesc: 'Dashboard voor alle producten en conversies', enterKeywordTitle: 'Voer een zoekwoord in', enterKeywordText: 'Typ een niche, branche of onderwerp om te beginnen',
    nameTheme: 'Noem het thema', nameThemeText: 'Vul de {theme} in die je landingspagina moet oproepen.',
  },
  es: {
    tagline: 'Fábrica de productos digitales con IA', login: 'Iniciar sesión', catalog: 'Catálogo', brain: 'Cerebro',
    heroBadge: 'Una palabra clave. Una sesión. Un negocio de producto completo.', heroStart: 'Convierte cualquier palabra clave en', heroEnd: 'un imperio digital',
    heroDescription: '7 módulos de IA. Análisis UVZ → producto → herramienta → chatbot → curso → embudo → catálogo. Puntuado, empaquetado y listo para Whop.',
    keywordPlaceholder: 'Escribe una palabra clave — zodiaco, keto, freelance, entrenamiento canino...', forge: 'Crear', starting: 'Creando...',
    tryExamples: 'Prueba: “compatibilidad zodiacal” · “pérdida de peso perimenopausia” · “ingresos repartidor” · “agresión con correa”',
    noTheme: 'Sin tema de página', country: 'País', place: 'Isla o lugar', event: 'Evento', zodiac: 'Signo zodiacal', custom: 'Tema personalizado',
    themeHelp: 'Opcional: guía la página con un tema visual de lugar, evento, zodiaco o personalizado.',
    productsBuilt: 'Productos creados', funnelsLive: 'Embudos activos', chatSessions: 'Sesiones de chat', totalEvents: 'Eventos totales',
    modules: 'Los 7 módulos', moduleNote: 'Todos se ejecutan en orden al iniciar un proyecto', newProject: 'Nuevo proyecto', enterKeyword: 'Escribe una palabra clave arriba',
    recentProjects: 'Proyectos recientes', viewAll: 'Ver todo', noProjects: 'Aún no hay proyectos', noProjectsText: 'Escribe una palabra clave arriba y pulsa Crear para hacer tu primer sistema de producto digital', startFirst: 'Iniciar primer proyecto',
    analyzer: 'Analizador UVZ', analyzerDesc: 'Convierte cualquier palabra clave en 10 opciones UVZ puntuadas', productGenerator: 'Generador de producto', productDesc: 'Genera título, esquema y recomendación de precio',
    toolBuilder: 'Creador de herramientas', toolDesc: 'Calculadora, cuestionario, planificador, rastreador, generador', advisor: 'Asesor chatbot de IA', advisorDesc: 'Agente de ventas 24/7 entrenado en tu producto',
    courseMaker: 'Creador de cursos', courseDesc: 'Esquema → guion completo, diapositivas y hojas de trabajo', funnelBuilder: 'Creador de embudos', funnelDesc: 'Texto de página, secuencia de correo y hooks',
    analytics: 'Catálogo y analítica', analyticsDesc: 'Panel para todos los productos y conversiones', enterKeywordTitle: 'Escribe una palabra clave', enterKeywordText: 'Escribe cualquier nicho, sector o tema para empezar',
    nameTheme: 'Nombra el tema', nameThemeText: 'Introduce el {theme} que quieres que evoque la página.',
  },
  pap: {
    tagline: 'Fábrika di produkto digital ku AI', login: 'Drenta', catalog: 'Katalòg', brain: 'Serebro',
    heroBadge: 'Un palabra klave. Un seshon. Un negoshi komplet di produkto.', heroStart: 'Bira kualke palabra klave den', heroEnd: 'un imperio digital',
    heroDescription: '7 módulo di AI. Análisis UVZ → produkto → tool → chatbot → curso → funnel → katalòg. Skorá, empaketá i kla pa Whop.',
    keywordPlaceholder: 'Skirbi un palabra klave — zodiak, keto, freelance, entrenamentu di pushi...', forge: 'Krea', starting: 'Ta kuminsando...',
    tryExamples: 'Purba: “kompatibilidat di zodiak” · “pèrdida di peso den menopousia” · “entrada di repartidor” · “agreshon ku leish”',
    noTheme: 'Sin tema di página', country: 'Pais', place: 'Isla òf lugá', event: 'Evento', zodiac: 'Signo di zodiak', custom: 'Tema propio',
    themeHelp: 'Opshonal: guia bo página ku un tema visual di lugá, evento, zodiak òf propio.',
    productsBuilt: 'Produktonan kreá', funnelsLive: 'Funnels aktivo', chatSessions: 'Seshonnan di chat', totalEvents: 'Eventonan total',
    modules: 'E 7 módulonan', moduleNote: 'Tur ta kana na órden ora bo kuminsá un proyekto', newProject: 'Nobo proyekto', enterKeyword: 'Skirbi un palabra klave riba',
    recentProjects: 'Proyektonan resien', viewAll: 'Mira tur', noProjects: 'Aun no tin proyekto', noProjectsText: 'Skirbi un palabra klave riba i primi Krea pa hasi bo promé sistema di produkto digital', startFirst: 'Kuminsá promé proyekto',
    analyzer: 'Analizador UVZ', analyzerDesc: 'Bira kualke palabra klave den 10 opshon UVZ ku skor', productGenerator: 'Generador di produkto', productDesc: 'Generá título, esquema i konseho di preis',
    toolBuilder: 'Kreador di tool', toolDesc: 'Kalkuladó, quiz, planner, tracker, generador', advisor: 'Konsehero chatbot di AI', advisorDesc: 'Agente di benta 24/7 entrená riba bo produkto',
    courseMaker: 'Kreador di curso', courseDesc: 'Esquema → script komplet, slides i werkblad', funnelBuilder: 'Kreador di funnel', funnelDesc: 'Teksto di página, sekuensia di email i hooks',
    analytics: 'Katalòg i análisis', analyticsDesc: 'Dashboard pa tur produkto i konvershon', enterKeywordTitle: 'Skirbi un palabra klave', enterKeywordText: 'Skirbi un niche, industriya òf tópico pa kuminsá',
    nameTheme: 'Nombra e tema', nameThemeText: 'Pone e {theme} ku bo ke e página evoká.',
  },
}

type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => Promise<void>; t: (key: string, values?: Record<string, string>) => string }
const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (localStorage.getItem('trimind_locale') as Locale) || 'en')
  useEffect(() => { localeApi.get().then(({ locale: suggested }) => { if (!localStorage.getItem('trimind_locale') && copy[suggested as Locale]) { localStorage.setItem('trimind_locale', suggested); setLocaleState(suggested) } }).catch(() => {}) }, [])
  const setLocale = async (next: Locale) => { setLocaleState(next); localStorage.setItem('trimind_locale', next); try { await localeApi.save(next) } catch { /* Guests keep their local preference. */ } }
  const value = useMemo(() => ({ locale, setLocale, t: (key: string, values: Record<string, string> = {}) => Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, value), copy[locale][key] || copy.en[key] || key) }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() { const context = useContext(LocaleContext); if (!context) throw new Error('useLocale must be used inside LocaleProvider'); return context }
