// model.ts — the canonical Swatchbook data model and the on-disk format.
//
// The format IS the product: three line-oriented JSONL files under v1/, one
// record per line, so concurrent edits merge cleanly and any other tool (or
// future-you) can read them. A template is only a presentation layer over these
// records — a file written under one domain reads fine under any other.
//
//   v1/projects.jsonl   one Project per line   (the container; sets the domain)
//   v1/parts.jsonl      one Part per line      (a room / piece / model / panel …)
//   v1/entries.jsonl    one Entry per line     (a colour or finish decision)

import type { Domain } from '~/lib/templates'

export const DATA_DIR = 'v1'
export const PROJECTS_PATH = `${DATA_DIR}/projects.jsonl`
export const PARTS_PATH = `${DATA_DIR}/parts.jsonl`
export const ENTRIES_PATH = `${DATA_DIR}/entries.jsonl`

export interface Project {
  id: string
  name: string
  subtitle?: string
  notes?: string
  domain: Domain
  created: string
  updated: string
}

export interface Part {
  id: string
  projectId: string
  name: string
  notes?: string
  /** Domain-specific part fields, keyed by documented ids (e.g. species). */
  extra?: Record<string, string>
  created: string
  updated: string
}

/** One ordered step in a recipe — base/wash/layer, sand/oil/wax, glaze layers… */
export interface Step {
  role: string
  product?: string
  brand?: string
  code?: string
  hex?: string
  note?: string
}

export interface Entry {
  id: string
  partId: string
  /** The colour or finish name. */
  name: string
  brand?: string
  code?: string
  /** Eyeballed or pasted hex. Empty string / undefined = "no colour yet". */
  hex?: string
  /** The swatch is a representation, never a measurement: flag when it only
   *  approximates the real result (e.g. a fired glaze that can't be photographed). */
  approx?: boolean
  finish?: string
  line?: string
  type?: string
  surface?: string
  /** ISO YYYY-MM-DD. Defaults to the created date. */
  date?: string
  description?: string
  /** Ordered recipe. Empty or absent for single-colour domains. */
  steps?: Step[]
  /** Domain-specific fields, keyed by documented ids declared on the template. */
  extra?: Record<string, string>
  created: string
  updated: string
}

// ── ids + time ─────────────────────────────────────────────────────────────

/** Short, sortable-enough unique id. Avoids Math.random-only collisions by
 *  prefixing a base36 timestamp. */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── JSONL parse / serialize ──────────────────────────────────────────────────

/** Parse JSONL into records, skipping blank or malformed lines (so one bad line
 *  written by another tool never blanks the whole collection). */
export function parseJsonl<T>(text: string): T[] {
  const out: T[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      out.push(JSON.parse(trimmed) as T)
    } catch {
      /* skip unparseable line */
    }
  }
  return out
}

/** Serialize records to JSONL with a trailing newline (one object per line). */
export function serializeJsonl<T>(rows: T[]): string {
  return rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')
}

// ── export ───────────────────────────────────────────────────────────────────

export interface Dataset {
  projects: Project[]
  parts: Part[]
  entries: Entry[]
}

/** A flat, human-readable row per entry for CSV export. */
function flatRows(data: Dataset) {
  const partById = new Map(data.parts.map((p) => [p.id, p]))
  const projById = new Map(data.projects.map((p) => [p.id, p]))
  return data.entries.map((e) => {
    const part = partById.get(e.partId)
    const proj = part ? projById.get(part.projectId) : undefined
    return {
      project: proj?.name ?? '',
      domain: proj?.domain ?? '',
      part: part?.name ?? '',
      name: e.name,
      brand: e.brand ?? '',
      code: e.code ?? '',
      hex: e.hex ?? '',
      finish: e.finish ?? '',
      surface: e.surface ?? '',
      date: e.date ?? '',
      steps: (e.steps ?? []).map((s) => `${s.role}: ${s.product ?? ''}`.trim()).join(' → '),
      description: e.description ?? '',
    }
  })
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(data: Dataset): string {
  const rows = flatRows(data)
  const cols: (keyof (typeof rows)[number])[] = [
    'project', 'domain', 'part', 'name', 'brand', 'code', 'hex', 'finish', 'surface', 'date', 'steps', 'description',
  ]
  const header = cols.join(',')
  const body = rows.map((r) => cols.map((c) => csvCell(String(r[c] ?? ''))).join(',')).join('\n')
  return `${header}\n${body}\n`
}

/** Full structured export: the three collections in one JSON object. */
export function toJSON(data: Dataset): string {
  return JSON.stringify({ version: 1, ...data }, null, 2)
}

/** The canonical on-disk JSONL, all three files concatenated with headers. */
export function toJSONL(data: Dataset): string {
  return (
    `# projects.jsonl\n${serializeJsonl(data.projects)}` +
    `\n# parts.jsonl\n${serializeJsonl(data.parts)}` +
    `\n# entries.jsonl\n${serializeJsonl(data.entries)}`
  )
}

/** Parse a previously-exported file back into a Dataset. Accepts the structured
 *  JSON export ({version, projects, parts, entries}) and the canonical JSONL
 *  export (the three collections under `# <name>.jsonl` headers). Returns null if
 *  the text is neither (e.g. a flattened CSV, which can't be reconstructed). */
export function parseImport(text: string): Dataset | null {
  const trimmed = text.trim()

  // Structured JSON export.
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Partial<Dataset>
      if (Array.isArray(obj.projects) && Array.isArray(obj.parts) && Array.isArray(obj.entries)) {
        return { projects: obj.projects, parts: obj.parts, entries: obj.entries }
      }
    } catch {
      /* fall through to JSONL */
    }
  }

  // Canonical JSONL export: lines bucketed by `# <name>.jsonl` headers.
  const buckets: Dataset = { projects: [], parts: [], entries: [] }
  let cur: keyof Dataset | null = null
  let sawHeader = false
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^#\s*(projects|parts|entries)\.jsonl/i)
    if (m) {
      cur = m[1]!.toLowerCase() as keyof Dataset
      sawHeader = true
      continue
    }
    if (line.startsWith('#') || !cur) continue
    try {
      ;(buckets[cur] as unknown[]).push(JSON.parse(line))
    } catch {
      /* skip unparseable line */
    }
  }
  return sawHeader ? buckets : null
}

export function download(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
