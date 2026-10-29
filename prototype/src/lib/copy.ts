/**
 * Shared vocabulary. Import these instead of typing the words, so one concept has one label on every screen.
 * Changing a word here changes it everywhere.
 */
/**
 * GLOSSARY (canonical terms; every surface imports COPY, none types these words).
 *
 * Oversight debt = the plain sum of four queues:
 *   Footage     "Footage to review": recorded drive segments nobody has reviewed yet.
 *   To triage   Incidents still Captured or Triaged (nobody owns them). Never "Open incidents".
 *   Re-routed   Escalations nobody answered in time, so they moved to the next lead. Never "Stale escalations".
 *   Gaps        "Coverage gaps": shift windows with no primary lead.
 *
 * Escalation states, in order:
 *   Paged -> Timed out -> Re-routed -> Acknowledged -> Handled
 *   Paged         the current lead has been alerted and the clock is running.
 *   Timed out     that lead did not answer in time (about the person, past tense).
 *   Re-routed     it moved to the next lead on the rota (about the escalation).
 *   Acknowledged  someone took it. They own it now.
 *   Handled       all five protocol steps done. Closed.
 *   Clock:        "mm:ss left" (it then re-routes). Never "moves on" or "expires". None left: "Nobody is left to page."
 *
 * Rota roles:
 *   Primary  the lead on point for a shift window.
 *   Backup   the next lead paged if the primary does not answer.
 *   Escalation owner = whoever holds the escalation right now. Never "Held by" or "Calling".
 *   Incident owner   = whoever owns the incident. A different person; always say which.
 *
 * Lifecycle (incident):  Captured -> Triaged -> Owned -> Resolved -> Verified.
 * Flags (additive, violet): Escalated (has an escalation), Overdue (past its due time), Stale (no update for 72 h; incidents only).
 *
 * IDs: pair rule is ESC id in the title, INC id in the meta line.
 */
export const COPY = {
  /** Navigating to an escalation page. "Review" when it is yours to act on, "View" when someone else holds it. Banner, EscalationCard and palette all use this. */
  escalation: {
    review: 'Review',
    view: 'View',
    /** The act of taking responsibility. Only ever the button on the escalation page / card. */
    acknowledge: 'Acknowledge',
    handOff: 'Hand off',
    takeOver: 'Take over',
    call: 'Call operator',
    openIncident: 'Open incident',
    /** Chain wording. The incident owner and the escalation owner are different people: always say which. */
    chainRole: { 'Raised by': 'Raised by', 'Current owner': 'Escalation owner', 'Backup (rota)': 'Backup' } as Record<string, string>,
    ownerLabel: 'Escalation owner',
    noneLeft: 'If unanswered, nobody is left to page.',
    handled: 'Handled',
    acknowledged: 'Acknowledged',
    paged: 'Paged',
    timedOut: 'Timed out',
    rerouted: 'Re-routed',
    primary: 'Primary',
    backup: 'Backup',
    /** Chain row captions. */
    mustActYou: 'You must act now',
    mustAct: 'Must act',
    nextIfUnanswered: 'Next if unanswered',
    raised: 'Raised',
    timeLeft: (t: string) => `${t} left before it re-routes`,
  },
  /** Oversight-debt queue names (tile label, long form for definitions). */
  debt: {
    total: 'Oversight debt',
    footage: 'Footage',
    footageLong: 'Footage to review',
    triage: 'To triage',
    rerouted: 'Re-routed',
    gaps: 'Gaps',
    gapsLong: 'Coverage gaps',
  },
  flag: { Escalated: 'Escalated', Overdue: 'Overdue', Stale: 'Stale' } as const,
  incident: { ownerLabel: 'Incident owner' },
  /** One word for "no owner" everywhere (filters, cells, previews, headers). */
  unassigned: 'Unassigned',
  /** One reach vocabulary (chain and rota). */
  reach: { reachable: 'Reachable', unreachable: 'Unreachable', unknown: 'Unknown' } as const,
  /** Shift 'GY' is called Night in the UI. */
  shiftName: { AM: 'AM', PM: 'PM', GY: 'Night' } as const,
  escalatedCount: (n: number) => `${n} escalated`,
} as const
