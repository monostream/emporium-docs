import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

// Set by /docs/slope-analytics.js when the container injects it (SLOPE_PROJECT_KEY).
declare global {
  interface Window {
    slope?: { track(name: string, props?: Record<string, unknown>): void }
  }
}

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof document === 'undefined') return
    // The local search modal is teleported to <body>, however it was opened
    // (search button, Ctrl/Cmd+K or "/"), so watching body covers every path.
    new MutationObserver((records) => {
      const opened = records.some((r) =>
        [...r.addedNodes].some((n) => n instanceof HTMLElement && n.classList.contains('VPLocalSearchBox'))
      )
      if (opened) window.slope?.track('docs_search_used')
    }).observe(document.body, { childList: true })
  }
} satisfies Theme
