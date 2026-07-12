import { Plus } from 'lucide-react'
import type { Project } from '~/lib/model'
import { getTemplate } from '~/lib/templates'

// The projects rail: every container you're tracking, whatever its domain, in one
// place — the whole point is a single shelf, not a silo per craft.
export default function Sidebar({
  projects,
  counts,
  activeId,
  onSelect,
  onNew,
}: {
  projects: Project[]
  counts: Map<string, number>
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--panel-2)]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
          Projects
        </span>
        <button
          type="button"
          onClick={onNew}
          title="New project"
          aria-label="New project"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-2)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {projects.length === 0 ? (
          <p className="px-2 py-3 text-sm text-[var(--ink-3)]">No projects yet.</p>
        ) : (
          projects.map((p) => {
            const tpl = getTemplate(p.domain)
            const on = p.id === activeId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className={`mb-0.5 flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  on ? 'bg-[var(--panel)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'hover:bg-[var(--panel)]/60'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--ink)]">{p.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--ink-3)]">
                    {counts.get(p.id) ?? 0}
                  </span>
                </span>
                <span className="truncate text-[11px] text-[var(--ink-3)]">
                  {tpl.label}
                  {p.subtitle ? ` · ${p.subtitle}` : ''}
                </span>
              </button>
            )
          })
        )}
      </div>

      <button
        type="button"
        onClick={onNew}
        className="m-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--line)] py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <Plus size={15} />
        New project
      </button>
    </nav>
  )
}
