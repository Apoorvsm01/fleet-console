import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** `?embed=1` is read once at load and remembered for the session, so in-app navigation (which drops the query) stays in embed mode. */
const KEY = 'plumb.embed'
export const isEmbed = (): boolean => {
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') sessionStorage.setItem(KEY, '1')
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return new URLSearchParams(window.location.search).get('embed') === '1'
  }
}

/** Breathing room (px) kept around a scaled frame. */
const FRAME_MARGIN = 16

export function useViewportWidth(): number {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

/** Height of the SurfaceSwitcher bar in px (0 when absent). */
export const switcherHeight = (): number => document.querySelector<HTMLElement>('[data-switcher-bar]')?.offsetHeight ?? 0

/** Scale a presentation frame down (never up) to fit the space under the switcher. Uses a transform plus negative margins so the layout box shrinks with it and centring stays correct. */
export function useFitZoom<T extends HTMLElement>(enabled: boolean, deps: unknown[] = [], absolute = false): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const reset = () => { el.style.transform = ''; el.style.margin = ''; el.style.alignSelf = ''; el.style.justifySelf = ''; el.style.width = ''; el.style.position = ''; el.style.left = ''; el.style.top = '' }
    if (!enabled) { reset(); return }
    const fit = () => {
      reset()
      const w = el.offsetWidth, h = el.offsetHeight
      const z = Math.min(1, window.innerWidth / w, (window.innerHeight - switcherHeight() - FRAME_MARGIN) / h)
      if (z >= 1) return
      el.style.transformOrigin = 'center'
      if (absolute) {
        // Grid centring mis-sizes an overflowing item, so pin the frame to the stage centre instead.
        el.style.width = `${w}px`; el.style.boxSizing = 'border-box'; el.style.alignSelf = 'start'; el.style.justifySelf = 'start'; el.style.position = 'absolute'; el.style.left = '50%'; el.style.top = '50%'
        el.style.transform = `translate(-50%, -50%) scale(${z})`
        return
      }
      el.style.transform = `scale(${z})`
      el.style.margin = `${-(h * (1 - z)) / 2}px ${-(w * (1 - z)) / 2}px`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => { window.removeEventListener('resize', fit); reset() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])
  return ref
}
