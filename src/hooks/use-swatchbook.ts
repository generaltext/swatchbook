// use-swatchbook.ts — the app's data layer.
//
// The model lives in three synced JSONL files under v1/ (projects, parts,
// entries). This hook owns their subscribe/observe lifecycle, parses each into a
// typed array, and exposes actions that mutate by rewriting the affected file's
// whole next text (the runtime applies a minimal CRDT diff). Talks to General
// Text only through the platform-injected `window.gt` — no bundled client, no yjs.

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSeedData } from '~/lib/dev-seed'
import {
  ENTRIES_PATH,
  PARTS_PATH,
  PROJECTS_PATH,
  nowISO,
  parseJsonl,
  serializeJsonl,
  today,
  uid,
  type Dataset,
  type Entry,
  type Part,
  type Project,
} from '~/lib/model'
import type { Domain } from '~/lib/templates'

/** Drop keys whose value is undefined or '' so JSONL records stay tidy and we
 *  never write an explicit `undefined` into an optional field. */
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== '') (out as Record<string, unknown>)[k] = v
  }
  return out
}

/** Seed sample projects into an empty, throwaway workspace so the app never opens
 *  blank: standalone `pnpm dev` and the gallery "Try it live" demo. Keys off
 *  `gt.mode === 'demo'` (runtime 1.3+) and falls back to `gt.sync.isLocal`. Inert
 *  in a real workspace, and only ever seeds when it's empty. */
async function maybeSeed() {
  const gt = window.gt
  if (gt.mode !== 'demo' && !gt.sync.isLocal) return
  const files = await gt.listFiles()
  // Gate on the projects file specifically: a user who cleared their projects in
  // a demo keeps that empty state rather than getting reseeded.
  if (files.some((f) => f.path === PROJECTS_PATH && f.sizeBytes > 0)) return
  const seed = buildSeedData()
  await Promise.all([
    gt.writeFile(PROJECTS_PATH, serializeJsonl(seed.projects)).catch(() => {}),
    gt.writeFile(PARTS_PATH, serializeJsonl(seed.parts)).catch(() => {}),
    gt.writeFile(ENTRIES_PATH, serializeJsonl(seed.entries)).catch(() => {}),
  ])
}

export function useSwatchbook() {
  const gt = window.gt
  const [connected, setConnected] = useState(false)
  const [projectsText, setProjectsText] = useState('')
  const [partsText, setPartsText] = useState('')
  const [entriesText, setEntriesText] = useState('')

  const refs = useRef<Record<string, GtText | null>>({
    [PROJECTS_PATH]: null,
    [PARTS_PATH]: null,
    [ENTRIES_PATH]: null,
  })

  // --- Connection + seed ---
  useEffect(() => {
    gt.ready.then(() => setConnected(true)).catch(() => {})
    void maybeSeed()
    const unsubs = [
      gt.on('connected', () => setConnected(true)),
      gt.on('disconnected', () => setConnected(false)),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [gt])

  // --- Subscribe to the three files ---
  useEffect(() => {
    if (!connected) return
    const subs: { path: string; yt: GtText; update: () => void }[] = [
      { path: PROJECTS_PATH, set: setProjectsText },
      { path: PARTS_PATH, set: setPartsText },
      { path: ENTRIES_PATH, set: setEntriesText },
    ].map(({ path, set }) => {
      const yt = gt.subscribeFile(path)
      refs.current[path] = yt
      const update = () => set(yt.toString())
      update()
      yt.observe(update)
      return { path, yt, update }
    })
    return () => {
      subs.forEach(({ path, yt, update }) => {
        yt.unobserve(update)
        refs.current[path] = null
      })
    }
  }, [gt, connected])

  const projects = useMemo(() => parseJsonl<Project>(projectsText), [projectsText])
  const parts = useMemo(() => parseJsonl<Part>(partsText), [partsText])
  const entries = useMemo(() => parseJsonl<Entry>(entriesText), [entriesText])
  const dataset: Dataset = useMemo(() => ({ projects, parts, entries }), [projects, parts, entries])

  /** Rewrite one collection from its freshest on-disk text (not a stale closure),
   *  so rapid successive edits compose. */
  function write<T>(path: string, mutate: (rows: T[]) => T[]): T[] {
    const yt = refs.current[path] ?? gt.subscribeFile(path)
    const oldVal = yt.toString()
    const rows = parseJsonl<T>(oldVal)
    const next = mutate(rows)
    gt.applyDiff(yt, oldVal, serializeJsonl(next))
    return next
  }

  const touch = <T extends { updated: string }>(r: T): T => ({ ...r, updated: nowISO() })

  const actions = {
    addProject(input: { name: string; subtitle?: string; domain: Domain }): string {
      const id = uid()
      const now = nowISO()
      write<Project>(PROJECTS_PATH, (rows) => [
        ...rows,
        { id, name: input.name, domain: input.domain, ...(input.subtitle ? { subtitle: input.subtitle } : {}), created: now, updated: now },
      ])
      return id
    },

    updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'subtitle' | 'notes'>>) {
      write<Project>(PROJECTS_PATH, (rows) => rows.map((p) => (p.id === id ? touch({ ...p, ...patch }) : p)))
    },

    removeProject(id: string) {
      const partIds = new Set(parts.filter((p) => p.projectId === id).map((p) => p.id))
      write<Project>(PROJECTS_PATH, (rows) => rows.filter((p) => p.id !== id))
      write<Part>(PARTS_PATH, (rows) => rows.filter((p) => p.projectId !== id))
      write<Entry>(ENTRIES_PATH, (rows) => rows.filter((e) => !partIds.has(e.partId)))
    },

    addPart(projectId: string, name: string, extra?: Record<string, string>): string {
      const id = uid()
      const now = nowISO()
      write<Part>(PARTS_PATH, (rows) => [
        ...rows,
        { id, projectId, name, ...(extra ? { extra } : {}), created: now, updated: now },
      ])
      return id
    },

    updatePart(id: string, patch: Partial<Pick<Part, 'name' | 'notes' | 'extra'>>) {
      write<Part>(PARTS_PATH, (rows) => rows.map((p) => (p.id === id ? touch({ ...p, ...patch }) : p)))
    },

    removePart(id: string) {
      write<Part>(PARTS_PATH, (rows) => rows.filter((p) => p.id !== id))
      write<Entry>(ENTRIES_PATH, (rows) => rows.filter((e) => e.partId !== id))
    },

    addEntry(partId: string, data: Partial<Entry>): string {
      const id = uid()
      const now = nowISO()
      const clean = stripUndefined(data)
      write<Entry>(ENTRIES_PATH, (rows) => [
        ...rows,
        { name: '', date: today(), ...clean, id, partId, created: now, updated: now },
      ])
      return id
    },

    updateEntry(id: string, patch: Partial<Entry>) {
      const clean = stripUndefined(patch)
      write<Entry>(ENTRIES_PATH, (rows) => rows.map((e) => (e.id === id ? touch({ ...e, ...clean }) : e)))
    },

    removeEntry(id: string) {
      write<Entry>(ENTRIES_PATH, (rows) => rows.filter((e) => e.id !== id))
    },

    /** Merge an imported dataset by id: records whose id already exists are left
     *  untouched (so re-importing a backup is idempotent), the rest are appended.
     *  Returns counts and a project id to focus on. */
    importDataset(incoming: { projects: Project[]; parts: Part[]; entries: Entry[] }): {
      added: number
      skipped: number
      focusProjectId: string | null
    } {
      let added = 0
      let skipped = 0
      const merge = <T extends { id: string }>(path: string, rows: T[]) => {
        write<T>(path, (existing) => {
          const have = new Set(existing.map((r) => r.id))
          const fresh = rows.filter((r) => r && typeof r.id === 'string' && !have.has(r.id))
          added += fresh.length
          skipped += rows.length - fresh.length
          return [...existing, ...fresh]
        })
      }
      merge<Project>(PROJECTS_PATH, incoming.projects ?? [])
      merge<Part>(PARTS_PATH, incoming.parts ?? [])
      merge<Entry>(ENTRIES_PATH, incoming.entries ?? [])
      return { added, skipped, focusProjectId: incoming.projects?.[0]?.id ?? null }
    },
  }

  return { connected, dataset, projects, parts, entries, actions } as const
}
