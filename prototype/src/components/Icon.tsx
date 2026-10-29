import { cx } from '../lib/cx'

const P: Record<string, string> = {
  now: 'M2 8h3l2-5 2 10 2-5h3',
  inbox: 'M2 9l2-6h8l2 6v4H2zM2 9h4l1 2h2l1-2h4',
  owned: 'M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 14c.5-3 2.7-4.5 5.5-4.5M10 12l1.5 1.5L14 10.5',
  review: 'M2 3h12v10H2zM6 6.5v3l3-1.5zM2 6h2M2 10h2M12 6h2M12 10h2',
  fleet: 'M2 10V8l1.5-3.5h9L14 8v2M2 10h12M2 10v2.5h2V10M12 10v2.5h2V10M4.5 8h7',
  plan: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3',
  check: 'M3 8.5l3.2 3L13 4.5',
  up: 'M4 10l4-4 4 4',
  down: 'M4 6l4 4 4-4',
  left: 'M10 3L5 8l5 5',
  right: 'M6 3l5 5-5 5',
  x: 'M4 4l8 8M12 4l-8 8',
  search: 'M7 12A5 5 0 107 2a5 5 0 000 10zM11 11l3.5 3.5',
  'arrow-up-bar': 'M8 14V5M4.5 8.5L8 5l3.5 3.5M3 2.5h10',
  clock: 'M8 14A6 6 0 108 2a6 6 0 000 12zM8 4.5V8l2.2 1.5',
  hourglass: 'M4 2h8M4 14h8M5 2c0 3 3 4 3 6s-3 3-3 6M11 2c0 3-3 4-3 6s3 3 3 6',
  'hourglass-dashed': 'M4 2h8M4 14h8M5 2c0 3 3 4 3 6s-3 3-3 6M11 2c0 3-3 4-3 6s3 3 3 6',
  help: 'M8 14A6 6 0 108 2a6 6 0 000 12zM6.2 6.3a1.9 1.9 0 013.6.7c0 1.3-1.8 1.5-1.8 2.7M8 11.4v.1',
  keyboard: 'M1.5 4.5h13v8h-13zM4 7h.1M6.5 7h.1M9 7h.1M11.5 7h.1M4.5 10h7',
  phone: 'M4 2.5l2 .5 1 3-1.5 1a8 8 0 003 3l1-1.5 3 1 .5 2c-.5 1-1.5 1.5-2.5 1.5C7 13 3 9 2.5 5c0-1 .5-2 1.5-2.5z',
  external: 'M9 3h4v4M13 3L7.5 8.5M11 9v4H3V5h4',
  sun: 'M8 11a3 3 0 100-6 3 3 0 000 6zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3',
  moon: 'M13.5 9.5A5.5 5.5 0 116.5 2.5a4.5 4.5 0 007 7z',
  density: 'M2 4h12M2 8h12M2 12h12',
  command: 'M5 5V4a1.5 1.5 0 10-1.5 1.5H5zm0 0h6m-6 0v6m6-6V4A1.5 1.5 0 1112.5 5.5H11zm0 0v6m0 0v1a1.5 1.5 0 101.5-1.5H11zm0 0H5m0 0v1A1.5 1.5 0 113.5 11.5H5z',
  alert: 'M8 2l6.5 11.5h-13zM8 6.5v3M8 11.2v.1',
  plus: 'M8 3v10M3 8h10',
  filter: 'M2 3h12l-4.5 5.5V13l-3-1.5V8.5z',
  car: 'M2 10V8l1.5-3.5h9L14 8v2M2 10h12',
  map: 'M2 4l4-1.5 4 1.5 4-1.5v9.5L10 13.5 6 12l-4 1.5zM6 2.5V12M10 4v9.5',
  empty: 'M2.5 3.5h11v9h-11zM2.5 9h3l1 1.5h3L10.5 9h3',
  retry: 'M13 8a5 5 0 11-1.5-3.5M13 2.5v3h-3',
  user: 'M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 14c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5',
  eye: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z',
}

/** 16px (density-aware) stroke icon. `name` keys: now inbox owned review fleet plan check up down left right x search arrow-up-bar clock hourglass hourglass-dashed help keyboard phone external sun moon density command alert plus filter car map empty retry user eye. Decorative unless `label` is given. */
export function Icon({ name, label, className }: { name: keyof typeof P | string; label?: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={cx('size-icon shrink-0', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={P[name] ?? P.empty} strokeDasharray={name === 'hourglass-dashed' ? '2 2' : undefined} />
    </svg>
  )
}
