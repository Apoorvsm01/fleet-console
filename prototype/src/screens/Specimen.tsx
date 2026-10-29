import type { ReactNode } from 'react'
import { FlagPill, SeverityChip, StatusMarker } from '../components'
import { LIFECYCLE, type Flag, type Sev } from '../data/types'

const SEVS: Sev[] = [1, 2, 3]
const FLAGS: Flag[] = ['Escalated', 'Overdue', 'Stale']
const SCALE = [
  ['text-2xl', '2xl / 40', '10,000'],
  ['text-xl', 'xl / 28', '1,284 vehicles'],
  ['text-lg', 'lg / 20', 'INC-4140 0 open'],
  ['text-md', 'md / 16', '11:08:42 · 10,000 events'],
  ['text-base', 'base / 14', 'Tabular numerals line up: 1,111 / 8,888'],
  ['text-sm', 'sm / 12', 'Cell metadata 0123456789'],
  ['text-xs', 'xs / 11', 'Caption 0123456789'],
] as const

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-fg-subtle uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Sevs({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-fg-subtle">{label}</span>
      <div className="flex gap-2">{SEVS.map((s) => <SeverityChip key={s} sev={s} />)}</div>
    </div>
  )
}

function Row({ density }: { density: 'comfortable' | 'compact' }) {
  return (
    <div data-density={density} className="flex flex-col gap-1">
      <span className="text-sm text-fg-subtle">{density === 'comfortable' ? 'Comfortable, 36 px' : 'Compact, 28 px'}</span>
      <div className="flex h-row items-center gap-3 rounded-sm border border-line bg-surface px-pad">
        <SeverityChip sev={2} />
        <span className="font-mono text-base text-fg-muted">INC-4127</span>
        <span className="min-w-0 flex-1 truncate text-base">Lidar dropout on repeated left turns near Odaiba Pier</span>
        <StatusMarker status="Owned" flags={['Overdue']} flagAge={{ Overdue: '2d' }} />
      </div>
    </div>
  )
}

/** Plumb specimen sheet at /specimen, built for the case study (1440x900). */
export default function Specimen() {
  return (
    <main className="grid min-h-screen grid-cols-2 content-start gap-x-10 gap-y-6 bg-canvas p-8 text-fg">
      <header className="col-span-2 flex items-baseline justify-between border-b border-line pb-3">
        <h1 className="text-xl font-semibold">Plumb specimen</h1>
        <span className="text-base text-fg-subtle">Never trust a single channel</span>
      </header>

      <Section title="Severity: colour and grayscale">
        <div className="flex gap-8 rounded-lg border border-line bg-surface p-4">
          <Sevs label="Colour" />
          <div className="flex flex-col gap-2" style={{ filter: 'grayscale(1)' }}><Sevs label="Grayscale" /></div>
        </div>
        <p className="mt-2 text-sm text-fg-muted">Label, glyph shape, fill weight and hue each separate the levels on their own.</p>
      </Section>

      <Section title="Flags">
        <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface p-4">
          {FLAGS.map((f) => <FlagPill key={f} flag={f} age={f === 'Overdue' ? '2d' : undefined} />)}
        </div>
      </Section>

      <Section title="Lifecycle status" className="col-span-2">
        <div className="grid grid-cols-5 gap-4 rounded-lg border border-line bg-surface p-4">
          {LIFECYCLE.map((s) => <StatusMarker key={s} status={s} />)}
        </div>
      </Section>

      <Section title="Row density">
        <div className="flex flex-col gap-3"><Row density="comfortable" /><Row density="compact" /></div>
      </Section>

      <Section title="Type scale, tabular numerals">
        <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4">
          {SCALE.map(([cls, name, sample]) => (
            <div key={cls} className="flex items-baseline gap-4">
              <span className="w-20 shrink-0 font-mono text-xs text-fg-subtle">{name}</span>
              <span className={`${cls} tnum truncate`}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
