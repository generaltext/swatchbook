import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, Menu, Moon, Pencil, Plus, Sun, SwatchBook, Upload } from 'lucide-react'
import ChipCard from '~/components/ChipCard'
import EntryDialog from '~/components/EntryDialog'
import PartDialog from '~/components/PartDialog'
import ProjectDialog from '~/components/ProjectDialog'
import Sidebar from '~/components/Sidebar'
import { useSwatchbook } from '~/hooks/use-swatchbook'
import { useTheme } from '~/hooks/use-theme'
import { download, parseImport, toCSV, toJSON, toJSONL, type Entry, type Part, type Project } from '~/lib/model'
import { getTemplate, type Domain } from '~/lib/templates'

export default function App() {
  const { connected, dataset, projects, parts, entries, actions } = useSwatchbook()
  const { dark, canToggle, toggle } = useTheme()
  const isDemo = window.gt.version === 'demo'

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activePartId, setActivePartId] = useState<string | null>(null)
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; initial: Project | null }>({ open: false, initial: null })
  const [partDialog, setPartDialog] = useState<{ open: boolean; initial: Part | null }>({ open: false, initial: null })
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; initial: Entry | null }>({ open: false, initial: null })
  const [notice, setNotice] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false) // mobile projects drawer

  // Selecting a project also closes the mobile drawer (no-op on desktop).
  function chooseProject(id: string) {
    setActiveProjectId(id)
    setActivePartId(null)
    setNavOpen(false)
  }
  function openNewProject() {
    setProjectDialog({ open: true, initial: null })
    setNavOpen(false)
  }

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice((cur) => (cur === message ? null : cur)), 4000)
  }

  async function onImport(file: File) {
    let text: string
    try {
      text = await file.text()
    } catch {
      flash("Couldn't read that file.")
      return
    }
    const data = parseImport(text)
    if (!data) {
      flash('Unrecognized file. Import a Swatchbook JSON or JSONL export.')
      return
    }
    const { added, skipped, focusProjectId } = actions.importDataset(data)
    if (added === 0) {
      flash(skipped > 0 ? 'Already up to date — nothing new to import.' : 'No records found in that file.')
    } else {
      flash(`Imported ${added} record${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} already present` : ''}.`)
      if (focusProjectId) setActiveProjectId(focusProjectId)
    }
  }

  // --- keep a valid project selected ---
  useEffect(() => {
    if (projects.length === 0) {
      if (activeProjectId !== null) setActiveProjectId(null)
    } else if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects[0]!.id)
    }
  }, [projects, activeProjectId])

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )
  const template = activeProject ? getTemplate(activeProject.domain) : null
  const projectParts = useMemo(
    () => parts.filter((p) => p.projectId === activeProjectId),
    [parts, activeProjectId],
  )

  // --- keep a valid part selected within the active project ---
  useEffect(() => {
    if (projectParts.length === 0) {
      if (activePartId !== null) setActivePartId(null)
    } else if (!activePartId || !projectParts.some((p) => p.id === activePartId)) {
      setActivePartId(projectParts[0]!.id)
    }
  }, [projectParts, activePartId])

  const activePart = useMemo(
    () => projectParts.find((p) => p.id === activePartId) ?? null,
    [projectParts, activePartId],
  )
  const partEntries = useMemo(
    () => entries.filter((e) => e.partId === activePartId),
    [entries, activePartId],
  )

  // entry count per project, for the sidebar
  const counts = useMemo(() => {
    const partToProject = new Map(parts.map((p) => [p.id, p.projectId]))
    const m = new Map<string, number>()
    for (const e of entries) {
      const pid = partToProject.get(e.partId)
      if (pid) m.set(pid, (m.get(pid) ?? 0) + 1)
    }
    return m
  }, [parts, entries])

  // --- project handlers ---
  function submitProject(input: { name: string; subtitle?: string; domain: Domain }) {
    if (projectDialog.initial) {
      actions.updateProject(projectDialog.initial.id, { name: input.name, ...(input.subtitle ? { subtitle: input.subtitle } : { subtitle: '' }) })
    } else {
      const id = actions.addProject(input)
      setActiveProjectId(id)
      setActivePartId(null)
    }
    setProjectDialog({ open: false, initial: null })
  }
  function deleteProject() {
    if (projectDialog.initial) actions.removeProject(projectDialog.initial.id)
    setProjectDialog({ open: false, initial: null })
  }

  // --- part handlers ---
  function submitPart(data: { name: string; extra?: Record<string, string> }) {
    if (partDialog.initial) {
      actions.updatePart(partDialog.initial.id, data)
    } else if (activeProjectId) {
      const id = actions.addPart(activeProjectId, data.name, data.extra)
      setActivePartId(id)
    }
    setPartDialog({ open: false, initial: null })
  }
  function deletePart() {
    if (partDialog.initial) actions.removePart(partDialog.initial.id)
    setPartDialog({ open: false, initial: null })
  }

  // --- entry handlers ---
  function submitEntry(data: Partial<Entry>) {
    if (entryDialog.initial) actions.updateEntry(entryDialog.initial.id, data)
    else if (activePartId) actions.addEntry(activePartId, data)
    setEntryDialog({ open: false, initial: null })
  }
  function deleteEntry() {
    if (entryDialog.initial) actions.removeEntry(entryDialog.initial.id)
    setEntryDialog({ open: false, initial: null })
  }

  return (
    <div className="flex h-full flex-col bg-[var(--paper)] text-[var(--ink)]">
      <Header
        dark={dark}
        canToggle={canToggle}
        toggle={toggle}
        isDemo={isDemo}
        dataset={dataset}
        onImport={onImport}
        onMenu={() => setNavOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        {/* Desktop: persistent rail. */}
        <div className="hidden md:flex">
          <Sidebar
            projects={projects}
            counts={counts}
            activeId={activeProjectId}
            onSelect={chooseProject}
            onNew={openNewProject}
          />
        </div>

        {/* Mobile: slide-in drawer over a backdrop. */}
        {navOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setNavOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="absolute left-0 top-0 h-full max-w-[80vw] shadow-2xl">
              <Sidebar
                projects={projects}
                counts={counts}
                activeId={activeProjectId}
                onSelect={chooseProject}
                onNew={openNewProject}
              />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          {!connected ? (
            <Centered>Connecting…</Centered>
          ) : !activeProject || !template ? (
            <EmptyProjects onNew={() => setProjectDialog({ open: true, initial: null })} />
          ) : (
            <>
              {/* breadcrumb */}
              <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 pb-3 pt-4 sm:px-6">
                <h1 className="min-w-0 shrink truncate text-lg font-semibold">{activeProject.name}</h1>
                {activeProject.subtitle && (
                  <span className="hidden min-w-0 shrink truncate text-sm text-[var(--ink-3)] sm:inline">
                    {activeProject.subtitle}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setProjectDialog({ open: true, initial: activeProject })}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
                  title="Project settings"
                  aria-label="Project settings"
                >
                  <Pencil size={15} />
                </button>
                <span className="ml-auto shrink-0 rounded-full bg-[var(--panel-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-3)]">
                  {template.label}
                </span>
              </div>

              {/* part tabs — horizontally scrollable on narrow screens */}
              <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--line)] px-4 py-2 sm:flex-wrap sm:px-5">
                {projectParts.map((part) => {
                  const on = part.id === activePartId
                  return (
                    <div key={part.id} className="group flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setActivePartId(part.id)}
                        className={`rounded-md px-3 py-2 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                          on ? 'bg-[var(--accent-soft)] font-semibold text-[var(--accent-deep)]' : 'text-[var(--ink-2)] hover:bg-[var(--panel-2)]'
                        }`}
                      >
                        {part.name}
                        {part.extra?.species ? <span className="ml-1.5 font-normal text-[var(--ink-3)]">· {part.extra.species}</span> : null}
                      </button>
                      {on && (
                        <button
                          type="button"
                          onClick={() => setPartDialog({ open: true, initial: part })}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[var(--ink-3)] transition-colors hover:text-[var(--ink)]"
                          title={`Edit ${template.tiers.part.toLowerCase()}`}
                          aria-label={`Edit ${template.tiers.part.toLowerCase()}`}
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setPartDialog({ open: true, initial: null })}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-2 text-[13px] font-medium text-[var(--ink-3)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--accent-deep)]"
                >
                  <Plus size={14} /> {template.tiers.part}
                </button>
              </div>

              {/* chip grid */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {!activePart ? (
                  <EmptyParts tier={template.tiers.part} onAdd={() => setPartDialog({ open: true, initial: null })} />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(186px,1fr))] sm:gap-3.5">
                    {partEntries.map((entry) => (
                      <ChipCard
                        key={entry.id}
                        entry={entry}
                        template={template}
                        onClick={() => setEntryDialog({ open: true, initial: entry })}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setEntryDialog({ open: true, initial: null })}
                      className="flex min-h-[150px] items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-dashed border-[var(--line)] text-sm font-semibold text-[var(--ink-3)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <Plus size={16} /> New {template.tiers.entry.toLowerCase()}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--ink)] shadow-xl"
        >
          {notice}
        </div>
      )}

      <ProjectDialog
        open={projectDialog.open}
        initial={projectDialog.initial}
        onClose={() => setProjectDialog({ open: false, initial: null })}
        onSubmit={submitProject}
        onDelete={deleteProject}
      />
      {template && (
        <>
          <PartDialog
            open={partDialog.open}
            template={template}
            initial={partDialog.initial}
            onClose={() => setPartDialog({ open: false, initial: null })}
            onSave={submitPart}
            onDelete={deletePart}
          />
          <EntryDialog
            open={entryDialog.open}
            template={template}
            initial={entryDialog.initial}
            entryTier={template.tiers.entry}
            onClose={() => setEntryDialog({ open: false, initial: null })}
            onSave={submitEntry}
            onDelete={deleteEntry}
          />
        </>
      )}
    </div>
  )
}

function Header({
  dark,
  canToggle,
  toggle,
  isDemo,
  dataset,
  onImport,
  onMenu,
}: {
  dark: boolean
  canToggle: boolean
  toggle: () => void
  isDemo: boolean
  dataset: { projects: Project[]; parts: Part[]; entries: Entry[] }
  onImport: (file: File) => void
  onMenu: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const exportAs = (kind: 'csv' | 'json' | 'jsonl') => {
    if (kind === 'csv') download('swatchbook.csv', toCSV(dataset), 'text/csv')
    else if (kind === 'json') download('swatchbook.json', toJSON(dataset), 'application/json')
    else download('swatchbook.jsonl', toJSONL(dataset), 'text/plain')
    setMenuOpen(false)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--panel-2)] px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open projects"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--ink-2)] transition-colors hover:bg-[var(--panel)] md:hidden"
        >
          <Menu size={19} />
        </button>
        <SwatchBook size={20} className="shrink-0 text-[var(--accent)]" />
        <span className="truncate text-[15px] font-semibold tracking-tight">Swatchbook</span>
        {isDemo && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-deep)]">
            Demo
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <input
          ref={fileRef}
          type="file"
          accept=".json,.jsonl,application/json,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImport(file)
            e.target.value = '' // allow re-importing the same file
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Import"
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--panel)] sm:px-3"
        >
          <Upload size={16} /> <span className="hidden sm:inline">Import</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Export"
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--panel)] sm:px-3"
          >
            <Download size={16} /> <span className="hidden sm:inline">Export</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] py-1 shadow-xl">
              <MenuItem onClick={() => exportAs('csv')} label="CSV" hint="one row per entry" />
              <MenuItem onClick={() => exportAs('json')} label="JSON" hint="structured" />
              <MenuItem onClick={() => exportAs('jsonl')} label="JSONL" hint="canonical format" />
            </div>
          )}
        </div>
        {canToggle && (
          <button
            type="button"
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink-2)] transition-colors hover:bg-[var(--panel)]"
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
      </div>
    </header>
  )
}

function MenuItem({ onClick, label, hint }: { onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--panel-2)]"
    >
      <span className="font-medium text-[var(--ink)]">{label}</span>
      <span className="text-[11px] text-[var(--ink-3)]">{hint}</span>
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center text-sm text-[var(--ink-3)]">{children}</div>
}

function EmptyProjects({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <SwatchBook size={40} className="text-[var(--ink-3)]" />
      <div>
        <h2 className="text-lg font-semibold">Start your Swatchbook</h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--ink-3)]">
          Every colour and finish decision you make, kept as plaintext you own. Begin with a home,
          a workshop project, or anything else.
        </p>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Plus size={16} /> New project
      </button>
    </div>
  )
}

function EmptyParts({ tier, onAdd }: { tier: string; onAdd: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-[var(--ink-3)]">No {tier.toLowerCase()}s yet.</p>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
      >
        <Plus size={15} /> Add {tier.toLowerCase()}
      </button>
    </div>
  )
}
