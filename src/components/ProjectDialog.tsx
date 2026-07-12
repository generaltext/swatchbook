import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Project } from '~/lib/model'
import { DOMAIN_ORDER, getTemplate, type Domain } from '~/lib/templates'

// Create or edit a project. On create you also pick the domain — the one decision
// that sets the labels and fields for everything inside. Home paint and
// woodworking are live; the rest are shown as a hint of what's coming (the file
// format already supports them, so they'll light up without any data migration).
// On edit the domain is locked: changing it would reinterpret existing records.
export default function ProjectDialog({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  open: boolean
  initial: Project | null
  onClose: () => void
  onSubmit: (input: { name: string; subtitle?: string; domain: Domain }) => void
  onDelete?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [domain, setDomain] = useState<Domain>('home')
  const editing = !!initial

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      setName(initial?.name ?? '')
      setSubtitle(initial?.subtitle ?? '')
      setDomain(initial?.domain ?? 'home')
      dlg.showModal()
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open, initial])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit({ name: trimmed, ...(subtitle.trim() ? { subtitle: subtitle.trim() } : {}), domain })
  }

  const tpl = getTemplate(domain)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // backdrop click
      }}
      className="m-auto w-[min(540px,92vw)] rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <h2 className="text-xl font-semibold">{editing ? 'Project settings' : 'New project'}</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            {tpl.tiers.project} name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maple Street House"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            Subtitle <span className="font-normal normal-case text-[var(--ink-3)]">(optional)</span>
          </span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="412 Maple St"
            className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </label>

        <fieldset className="flex flex-col gap-2" disabled={editing}>
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            Domain {editing && <span className="font-normal normal-case">· locked once set</span>}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {DOMAIN_ORDER.map((d) => {
              const t = getTemplate(d)
              const selected = d === domain
              if (editing && !selected) return null
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!t.available || editing}
                  onClick={() => t.available && setDomain(d)}
                  className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : t.available
                        ? 'border-[var(--line)] hover:border-[var(--accent)]'
                        : 'cursor-not-allowed border-[var(--line-soft)] opacity-55'
                  }`}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--ink)]">{t.label}</span>
                    {!t.available && (
                      <span className="rounded-full bg-[var(--line-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                        Soon
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] leading-snug text-[var(--ink-3)]">{t.blurb}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between pt-1">
          {editing && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--accent)]"
            >
              <Trash2 size={15} /> Delete project
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--panel-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
