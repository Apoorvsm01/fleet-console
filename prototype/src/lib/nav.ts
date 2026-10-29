/** Top-level destinations. `g` + `go` navigates from anywhere (g n = Now). */
export const NAV_ITEMS = [
  { key: 'now', label: 'Now', to: '/now', icon: 'now', go: 'n' },
  { key: 'inbox', label: 'Inbox', to: '/inbox', icon: 'inbox', go: 'i' },
  { key: 'owned', label: 'Owned', to: '/owned', icon: 'owned', go: 'o' },
  { key: 'review', label: 'Review', to: '/review', icon: 'review', go: 'r' },
  { key: 'fleet', label: 'Fleet', to: '/fleet', icon: 'fleet', go: 'f' },
  { key: 'plan', label: 'Plan', to: '/plan', icon: 'plan', go: 'p' },
] as const
export type NavKey = (typeof NAV_ITEMS)[number]['key']
