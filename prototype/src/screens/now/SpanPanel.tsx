import { Link } from 'react-router-dom'
import { Avatar, PaneHeader } from '../../components/ui'
import { SPAN_BASELINE, type LeadSpan } from '../../lib/queries'
import { cx } from '../../lib/cx'
import { EmptyState } from '../../components'

/** Span of control per lead against the baseline. Over baseline is stated in words and a tick, not only color. */
export function SpanPanel({ spans, shiftName, operatorCount }: { spans: LeadSpan[]; shiftName: string; operatorCount: number }) {
  const max = Math.max(SPAN_BASELINE * 2, ...spans.map((s) => s.span))
  return (
    <section aria-label="Span of control" className="flex min-w-0 flex-col rounded-md border border-line bg-surface shadow-1">
      <PaneHeader title="Span of control" meta={`${shiftName} shift · baseline ${SPAN_BASELINE}:1`} />
      {spans.length === 0 ? <EmptyState variant="first-use" title="No leads on this shift" description="Assign a lead in Plan." /> : null}
      <ul className="flex flex-col divide-y divide-line">
        {spans.map(({ lead, span, overBaseline }) => (
          <li key={lead.id} className="flex flex-col gap-2 p-pane">
            <div className="flex items-center gap-gap">
              <Avatar initials={lead.initials} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-md text-fg">{lead.name}</div>
                <div className="text-sm text-fg-subtle">{lead.role}{lead.onCall ? ' · on call' : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold tabular-nums text-fg">{span}<span className="text-sm font-normal text-fg-subtle"> : 1</span></div>
                <div className={cx('text-sm', overBaseline ? 'font-medium text-fg' : 'text-fg-subtle')}>
                  {overBaseline ? `${span - SPAN_BASELINE} over baseline` : span === 0 ? 'No operators' : 'Within baseline'}
                </div>
              </div>
            </div>
            <div role="img" aria-label={`${span} of ${SPAN_BASELINE} baseline`} className="relative h-2 rounded-sm bg-track">
              <div className={cx('h-full rounded-sm', overBaseline ? 'bg-fg' : 'bg-accent')} style={{ width: `${Math.min(100, (span / max) * 100)}%` }} />
              <div className="absolute -top-1 -bottom-1 w-bar bg-fg" style={{ left: `${(SPAN_BASELINE / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-line px-pane py-2 text-sm text-fg-subtle">
        {operatorCount} operators on shift. <Link to="/fleet" className="text-accent underline underline-offset-2 hover:text-fg">Open fleet</Link>
      </div>
    </section>
  )
}
