// dev-seed.ts — the sample data a brand-new, empty workspace starts with:
// standalone `pnpm dev` and the gallery "Try it live" demo. Written once (see
// maybeSeed in use-swatchbook) only when the data is absent; entirely inert under
// a real General Text host. Two domains on purpose — home paint and woodworking —
// so the demo shows the generalization, not just walls.

import { type Dataset, type Entry, type Part, type Project, nowISO, uid } from '~/lib/model'

export function buildSeedData(): Dataset {
  const now = nowISO()
  const stamp = { created: now, updated: now }

  const home: Project = { id: uid(), name: 'Maple Street House', subtitle: '412 Maple St', domain: 'home', ...stamp }
  const wood: Project = { id: uid(), name: 'Walnut Side Table', subtitle: 'shop build', domain: 'wood', ...stamp }

  const living: Part = { id: uid(), projectId: home.id, name: 'Living Room', ...stamp }
  const kitchen: Part = { id: uid(), projectId: home.id, name: 'Kitchen', ...stamp }
  const bath: Part = { id: uid(), projectId: home.id, name: 'Primary Bath', ...stamp }
  const top: Part = { id: uid(), projectId: wood.id, name: 'Tabletop', extra: { species: 'Black walnut' }, ...stamp }
  const legs: Part = { id: uid(), projectId: wood.id, name: 'Legs', extra: { species: 'White oak' }, ...stamp }

  const entries: Entry[] = [
    { id: uid(), partId: living.id, name: 'Pale Oak', brand: 'Benjamin Moore', code: 'OC-20', hex: '#e7e2d6', finish: 'Eggshell', surface: 'Walls', date: '2025-04-12', ...stamp },
    { id: uid(), partId: living.id, name: 'White Dove', brand: 'Benjamin Moore', code: 'OC-17', hex: '#f1eee6', finish: 'Semi-gloss', surface: 'Trim', date: '2025-04-12', ...stamp },
    { id: uid(), partId: kitchen.id, name: 'Naval', brand: 'Sherwin-Williams', code: 'SW 6244', hex: '#2e3a4b', finish: 'Satin', surface: 'Cabinets', date: '2025-06-30', ...stamp },
    { id: uid(), partId: kitchen.id, name: 'Alabaster', brand: 'Sherwin-Williams', code: 'SW 7008', hex: '#efede4', finish: 'Flat', surface: 'Ceiling', date: '2025-06-28', ...stamp },
    { id: uid(), partId: bath.id, name: 'Borrowed Light', brand: 'Farrow & Ball', code: 'No. 235', hex: '#d7e0e1', finish: 'Matte', surface: 'Walls', date: '2026-02-15', ...stamp },
    {
      id: uid(), partId: top.id, name: 'Oiled & waxed', type: 'Danish oil', finish: 'Satin', hex: '#5a4632', date: '2026-05-03',
      description: 'Warmed the walnut nicely; second coat wet-sanded to fill grain.',
      steps: [
        { role: 'Sand', product: '120 → 180 → 220 grit' },
        { role: 'Finish coat', product: 'Watco Danish Oil', brand: 'Watco', note: '2 coats, wet-sand the 2nd' },
        { role: 'Wax / buff', product: 'Briwax clear', brand: 'Briwax' },
      ],
      ...stamp,
    },
    {
      id: uid(), partId: legs.id, name: 'Ebonized', type: 'Hard wax oil', finish: 'Matte', hex: '#241f1b', date: '2026-05-01',
      steps: [
        { role: 'Stain', product: 'Vinegar + steel wool (iron acetate)', note: 'reacts with oak tannin' },
        { role: 'Seal', product: 'Tried & True oil', brand: 'Tried & True', note: '1 coat' },
      ],
      ...stamp,
    },
  ]

  return { projects: [home, wood], parts: [living, kitchen, bath, top, legs], entries }
}
