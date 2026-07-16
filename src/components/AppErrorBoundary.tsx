import { Component, type ErrorInfo, type ReactNode } from 'react'

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ui_error', { message: error.message, stack: info.componentStack }) }
  render() {
    if (this.state.failed) return <main className="grid min-h-screen place-items-center bg-[#061f2d] p-6 text-center text-white"><section><h1 className="text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-slate-300">Refresh the page. If the problem continues, contact support with the time it happened.</p><button className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950" onClick={() => location.reload()}>Refresh</button></section></main>
    return this.props.children
  }
}
