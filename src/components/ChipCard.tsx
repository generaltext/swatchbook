import type { Entry } from '~/lib/model'
import type { Template } from '~/lib/templates'

/** Read a core or `extra:`-prefixed field off an entry as a display string. */
export function entryField(e: Entry, key: string): string {
  if (key.startsWith('extra:')) return e.extra?.[key.slice(6)] ?? ''
  const v = (e as unknown as Record<string, unknown>)[key]
  return typeof v === 'string' ? v : ''
}

// The chip card — the signature element. A colour block on top, the specs printed
// in the footer. All text lives in the footer, so a missing or approximate swatch
// never breaks the card.
export default function ChipCard({
  entry,
  template,
  onClick,
}: {
  entry: Entry
  template: Template
  onClick: () => void
}) {
  const spec = template.specFields.map((k) => entryField(entry, k)).filter(Boolean)
  const showSteps = template.steps && (entry.steps?.length ?? 0) > 0
  const codeOnSwatch = !!entry.hex && !!entry.code
  const codeInFooter = !!entry.code && !codeOnSwatch

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--panel)] text-left shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_18px_-14px_rgba(40,30,20,0.5)] transition-shadow hover:shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_24px_-12px_rgba(40,30,20,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
    >
      {/* swatch */}
      {entry.hex ? (
        <div className="relative flex h-24 items-end justify-end p-2" style={{ background: entry.hex }}>
          {entry.approx && (
            <span className="absolute left-2 top-2 rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white/90">
              approx
            </span>
          )}
          {codeOnSwatch && (
            <span className="rounded bg-white/82 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-neutral-800 ring-1 ring-black/5">
              {entry.code}
            </span>
          )}
        </div>
      ) : (
        <div
          className="flex h-24 items-center justify-center"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(125,125,125,0.14) 8px, rgba(125,125,125,0.14) 16px)',
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            no colour yet
          </span>
        </div>
      )}

      {/* footer */}
      <div className="flex flex-1 flex-col gap-0.5 px-3.5 pb-3.5 pt-3">
        <div className="text-[14.5px] font-semibold leading-tight text-[var(--ink)]">
          {entry.name || 'Untitled'}
        </div>
        {(entry.brand || codeInFooter) && (
          <div className="text-xs text-[var(--ink-2)]">
            {[entry.brand, codeInFooter ? entry.code : ''].filter(Boolean).join(' · ')}
          </div>
        )}
        {spec.length > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-[var(--ink-3)]">
            {spec.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-50">·</span>}
                {s}
              </span>
            ))}
          </div>
        )}

        {showSteps && (
          <div className="mt-2 flex flex-col gap-1 border-t border-dashed border-[var(--line)] pt-2">
            {entry.steps!.map((s, i) => (
              <div key={i} className="flex items-baseline gap-2 text-[11.5px]">
                <span className="w-[52px] shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                  {s.role}
                </span>
                <span className="min-w-0 text-[var(--ink-2)]">
                  {[s.product, s.note].filter(Boolean).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        )}

        {entry.date && (
          <div className="mt-auto pt-2 font-mono text-[10.5px] text-[var(--ink-3)]">{entry.date}</div>
        )}
      </div>
    </button>
  )
}
