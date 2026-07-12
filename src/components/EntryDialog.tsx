import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { today, type Entry, type Step } from '~/lib/model'
import type { FieldDef, Template } from '~/lib/templates'

type Values = Record<string, string>

const isValidHex = (s: string) => /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/.test(s.trim())
const normHex = (s: string) => {
  let h = s.trim().replace(/^#?/, '')
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
  return '#' + h.toLowerCase()
}

// The editor. Every field, label, and datalist comes from the template, so this
// one form serves all six domains. The swatch is always present (with a proper
// "no colour yet" state); the recipe steps appear only for domains that use them.
export default function EntryDialog({
  open,
  template,
  initial,
  entryTier,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean
  template: Template
  initial: Entry | null
  entryTier: string
  onClose: () => void
  onSave: (data: Partial<Entry>) => void
  onDelete?: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const dlId = useId()
  const [values, setValues] = useState<Values>({})
  const [hex, setHex] = useState('')
  const [hexText, setHexText] = useState('')
  const [approx, setApprox] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) {
      // Initialize from the entry being edited, or sensible defaults for a new one.
      const v: Values = {}
      for (const f of template.entryFields) {
        if (f.key.startsWith('extra:')) v[f.key] = initial?.extra?.[f.key.slice(6)] ?? ''
        else if (f.key === 'date') v[f.key] = initial?.date ?? today()
        else v[f.key] = (initial as unknown as Record<string, string>)?.[f.key] ?? ''
      }
      setValues(v)
      setHex(initial?.hex ?? '')
      setHexText(initial?.hex ?? '')
      setApprox(initial ? !!initial.approx : !!template.swatchApprox)
      setSteps(initial?.steps ? initial.steps.map((s) => ({ ...s })) : [])
      dlg.showModal()
    } else if (!open && dlg.open) {
      dlg.close()
    }
  }, [open, initial, template])

  const setField = (k: string, val: string) => setValues((v) => ({ ...v, [k]: val }))

  function commitHex(raw: string) {
    setHexText(raw)
    if (raw.trim() === '') setHex('')
    else if (isValidHex(raw)) setHex(normHex(raw))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const data: Record<string, unknown> = {}
    const extra: Record<string, string> = { ...(initial?.extra ?? {}) }
    for (const f of template.entryFields) {
      const val = (values[f.key] ?? '').trim()
      if (f.key.startsWith('extra:')) {
        const id = f.key.slice(6)
        if (val) extra[id] = val
        else delete extra[id]
      } else {
        data[f.key] = val
      }
    }
    if (!data.name) data.name = values.name ?? ''
    if (Object.keys(extra).length) data.extra = extra
    data.hex = hex
    if (approx && hex) data.approx = true
    if (template.steps) data.steps = steps.filter((s) => s.role.trim() || (s.product ?? '').trim())
    onSave(data as Partial<Entry>)
  }

  const title = initial ? `Edit ${entryTier.toLowerCase()}` : `New ${entryTier.toLowerCase()}`

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[min(620px,94vw)] rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} className="flex max-h-[88vh] flex-col">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* swatch */}
          <div className="mb-5 flex items-center gap-4">
            <div
              className="h-16 w-16 shrink-0 rounded-lg border border-[var(--line)]"
              style={
                hex
                  ? { background: hex }
                  : {
                      backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(125,125,125,0.18) 6px, rgba(125,125,125,0.18) 12px)',
                    }
              }
            />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hex || '#cccccc'}
                  onChange={(e) => commitHex(e.target.value)}
                  aria-label="Pick colour"
                  className="h-9 w-10 shrink-0 cursor-pointer rounded border border-[var(--line)] bg-transparent p-0.5"
                />
                <input
                  value={hexText}
                  onChange={(e) => commitHex(e.target.value)}
                  placeholder="#hex or leave blank"
                  className="w-36 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                {hex && (
                  <button
                    type="button"
                    onClick={() => commitHex('')}
                    className="text-xs font-medium text-[var(--ink-3)] underline-offset-2 hover:text-[var(--accent-deep)] hover:underline"
                  >
                    No colour
                  </button>
                )}
              </div>
              {hex && (
                <label className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
                  <input type="checkbox" checked={approx} onChange={(e) => setApprox(e.target.checked)} />
                  Approximate (a representation, not a measurement)
                </label>
              )}
            </div>
          </div>

          {/* template-driven fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {template.entryFields.map((f) => (
              <Field
                key={f.key}
                def={f}
                id={`${dlId}-${f.key}`}
                value={values[f.key] ?? ''}
                onChange={(val) => setField(f.key, val)}
              />
            ))}
          </div>

          {/* recipe steps */}
          {template.steps && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
                  Recipe steps
                </span>
                <button
                  type="button"
                  onClick={() => setSteps((s) => [...s, { role: '', product: '' }])}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent-deep)] transition-colors hover:bg-[var(--accent-soft)]"
                >
                  <Plus size={13} /> Add step
                </button>
              </div>
              <datalist id={`${dlId}-roles`}>
                {(template.stepRoles ?? []).map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              {steps.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--line)] px-3 py-3 text-xs text-[var(--ink-3)]">
                  No steps yet. A finish often is the sequence: sand → oil → wax.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-center font-mono text-xs text-[var(--ink-3)]">
                        {i + 1}
                      </span>
                      <input
                        list={`${dlId}-roles`}
                        value={s.role}
                        onChange={(e) =>
                          setSteps((arr) => arr.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))
                        }
                        placeholder="Step"
                        className="w-24 shrink-0 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] sm:w-28"
                      />
                      <input
                        value={s.product ?? ''}
                        onChange={(e) =>
                          setSteps((arr) => arr.map((x, j) => (j === i ? { ...x, product: e.target.value } : x)))
                        }
                        placeholder="Product / how"
                        className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => setSteps((arr) => arr.filter((_, j) => j !== i))}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--accent)]"
                        aria-label="Remove step"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] px-6 py-4">
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
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </dialog>
  )
}

function Field({
  def,
  id,
  value,
  onChange,
}: {
  def: FieldDef
  id: string
  value: string
  onChange: (val: string) => void
}) {
  const listId = useMemo(() => (def.datalist ? `${id}-list` : undefined), [def.datalist, id])
  const wide = def.input === 'textarea'

  const label = (
    <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
      {def.label}
    </label>
  )
  const cls =
    'rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]'

  let control: React.ReactNode
  if (def.input === 'select') {
    control = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        {(def.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  } else if (def.input === 'textarea') {
    control = (
      <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} className={cls} />
    )
  } else {
    control = (
      <>
        <input
          id={id}
          type={def.input === 'date' ? 'date' : 'text'}
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          className={cls}
        />
        {def.datalist && (
          <datalist id={listId}>
            {def.datalist.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
      </>
    )
  }

  return (
    <div className={`flex flex-col gap-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      {label}
      {control}
    </div>
  )
}
