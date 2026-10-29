import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Read/write one URL search param as string state (replace, not push). Convention: `q` = filter query, `view` = saved view id, `sel` = selected row key. */
export function useQueryState(key: string, fallback = ''): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(key) ?? fallback
  const set = useCallback((v: string) => {
    setParams((p) => { const n = new URLSearchParams(p); if (v === '' || v === fallback) n.delete(key); else n.set(key, v); return n }, { replace: true })
  }, [key, fallback, setParams])
  return [value, set]
}

/** Returns the value after it has been stable for `delay` ms (default 120, the split-pane "detail follows focus" dwell). */
export function useDwell<T>(value: T, delay = 120): T {
  const [v, setV] = useState(value)
  useEffect(() => { const id = window.setTimeout(() => setV(value), delay); return () => window.clearTimeout(id) }, [value, delay])
  return v
}
