import { useEffect, useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Part } from '~/lib/model'
import type { Template } from '~/lib/templates'

// Add or edit a part (a room / piece / model / panel …) and any domain-specific
// part fields the template declares, like wood species.
export default function PartDialog({
  open,
  template,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  template: Template
  initial: Part | null
  onClose: () => void
  onSave: (data: { name: string; extra?: Record<string, string> }) => void
  onDelete?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const dlId = useId()
  const [name, setName] = useState('')
  const [extra, setExtra] = useState<Record<string, string>>({})

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      setName(initial?.name ?? '')
      setExtra({ ...(initial?.extra ?? {}) })
      dlg.showModal()
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open, initial])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const cleanExtra: Record<string, string> = {}
    for (const [k, v] of Object.entries(extra)) if (v.trim()) cleanExtra[k] = v.trim()
    onSave({ name: trimmed, ...(Object.keys(cleanExtra).length ? { extra: cleanExtra } : {}) })
  }

  const tier = template.tiers.part

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[min(460px,92vw)] rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} className="flex flex-col gap-5 p-6">
        <h2 className="text-lg font-semibold">{initial ? `Edit ${tier.toLowerCase()}` : `New ${tier.toLowerCase()}`}</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
            {tier} name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tier === 'Room' ? 'Living Room' : tier}
            className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </label>

        {(template.partFields ?? []).map((f) => {
          const id = f.key.slice(6)
          const listId = f.datalist ? `${dlId}-${id}` : undefined
          return (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
                {f.label}
              </span>
              <input
                list={listId}
                value={extra[id] ?? ''}
                onChange={(e) => setExtra((x) => ({ ...x, [id]: e.target.value }))}
                placeholder={f.placeholder}
                className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              {f.datalist && (
                <datalist id={listId}>
                  {f.datalist.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              )}
            </label>
          )
        })}

        <div className="flex items-center justify-between pt-1">
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--accent)]"
            >
              <Trash2 size={15} /> Delete
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
              Save
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
