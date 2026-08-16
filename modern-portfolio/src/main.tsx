import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/App.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// After first paint, and never in the render path: analytics must not be able to
// delay or break the page. initAnalytics is idempotent and no-ops on localhost,
// for bots, and when the Supabase environment variables are absent.
// Property access rather than a bare global — Safari lacked requestIdleCallback
// until 16.4, and `requestIdleCallback?.()` on an undeclared name still throws.
if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(() => initAnalytics())
} else {
  setTimeout(initAnalytics, 1200)
}
