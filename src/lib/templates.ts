// templates.ts — the domain registry.
//
// A template is pure config. The on-disk format (model.ts) is universal; a
// template only chooses which core fields a domain shows, relabels the three
// tiers, supplies datalist suggestions, and decides whether the ordered `steps`
// recipe is the star. Adding a domain is adding an entry here — nothing else.
//
// All six domains are defined so any file reads correctly under any template.
// `available: true` marks the domains you can create today (home + woodworking);
// the rest are declared (their format is real and forward-compatible) and shown
// in the new-project picker as a hint of what's coming.

export type Domain = 'home' | 'wood' | 'minis' | 'scale' | 'ceramics' | 'auto'

/** A core Entry field key, or an `extra:<id>` key for domain-specific fields. */
export type FieldKey = string

export interface FieldDef {
  key: FieldKey
  label: string
  input?: 'text' | 'textarea' | 'select' | 'date'
  /** Free-text suggestions (an editable datalist). */
  datalist?: string[]
  /** Constrained choices (a real select). */
  options?: string[]
  placeholder?: string
}

export interface Template {
  domain: Domain
  /** Short label, e.g. "Home paint". */
  label: string
  /** Buildable today vs declared-but-coming. */
  available: boolean
  /** One-line description for the new-project picker. */
  blurb: string
  /** Tier names: container / part / entry. */
  tiers: { project: string; part: string; entry: string }
  /** Whether the ordered recipe is emphasized for this domain. */
  steps: boolean
  /** Datalist of step roles, in rough application order. */
  stepRoles?: string[]
  /** Whether the swatch should default to "approximate" (e.g. fired ceramics). */
  swatchApprox?: boolean
  /** Lead the entry form with the code rather than the name (automotive). */
  codeFirst?: boolean
  /** Per-entry fields shown in the editor (the swatch is always present). */
  entryFields: FieldDef[]
  /** Per-part fields beyond the name (e.g. wood species). */
  partFields?: FieldDef[]
  /** Entry keys shown on the chip footer spec line. */
  specFields: FieldKey[]
}

const FINISHES = ['Flat', 'Matte', 'Eggshell', 'Satin', 'Semi-gloss', 'Gloss', 'High-gloss']
const SURFACES = ['Walls', 'Trim', 'Ceiling', 'Doors', 'Cabinets', 'Accent wall', 'Exterior', 'Floor']
const PAINT_BRANDS = ['Benjamin Moore', 'Sherwin-Williams', 'Farrow & Ball', 'Behr', 'Valspar', 'Dunn-Edwards', 'Dulux']

const WOOD_SPECIES = ['Black walnut', 'White oak', 'Red oak', 'Hard maple', 'Cherry', 'Ash', 'Mahogany', 'Pine', 'Birch', 'Poplar']
const WOOD_FINISH_TYPES = ['Danish oil', 'Tung oil', 'Boiled linseed oil', 'Hard wax oil', 'Polyurethane (oil)', 'Polyurethane (water)', 'Shellac', 'Lacquer', 'Wiping varnish', 'Paste wax', 'Gel stain', 'Water-based dye']
const WOOD_SHEEN = ['Flat', 'Matte', 'Satin', 'Semi-gloss', 'Gloss']
const WOOD_METHOD = ['Rag', 'Brush', 'Spray (HVLP)', 'Wipe-on', 'Foam pad', 'Steel wool']
const WOOD_BRANDS = ['Watco', 'General Finishes', 'Minwax', 'Osmo', 'Rubio Monocoat', 'Tried & True', "Odie's Oil", 'Varathane', 'Briwax']
const WOOD_STEP_ROLES = ['Sand', 'Raise grain', 'Dye', 'Stain', 'Conditioner', 'Seal', 'Grain fill', 'Finish coat', 'Sand between', 'Wax / buff']

const MINI_BRANDS = ['Citadel', 'Vallejo', 'The Army Painter', 'Scale75', 'Pro Acryl', 'Reaper', 'AK Interactive']
const MINI_STEP_ROLES = ['Prime', 'Basecoat', 'Contrast', 'Wash / Shade', 'Layer', 'Drybrush', 'Highlight', 'Edge highlight', 'Glaze', 'Technical', 'Varnish']

const SCALE_BRANDS = ['Tamiya', 'Mr. Color', 'Mr. Hobby Aqueous', 'Vallejo Model Air', 'Vallejo Model Color', 'AK Real Colors', 'Humbrol', 'Mig Ammo', 'Mission Models']
const SCALE_STEP_ROLES = ['Primer', 'Pre-shade', 'Base coat', 'Modulation', 'Gloss coat', 'Decals', 'Wash', 'Filter', 'Weathering', 'Final varnish']

const CERAMIC_METHOD = ['Dipping', 'Brushing', 'Spraying', 'Pouring']
const CERAMIC_ATMOS = ['Oxidation', 'Reduction', 'Neutral', 'Soda', 'Salt', 'Wood']
const CERAMIC_CONES = ['022', '06', '04', '02', '1', '4', '5', '6', '7', '8', '9', '10', '11']

const AUTO_BRANDS = ['PPG', 'BASF Glasurit', 'Axalta Cromax', 'Spies Hecker', 'Sherwin-Williams', 'House of Kolor', 'Dr. ColorChip', 'Duplicolor', 'OEM dealer pen']
const AUTO_SYSTEMS = ['Single-stage', 'Basecoat / clearcoat', 'Tri-coat (pearl)', 'Candy']

export const TEMPLATES: Record<Domain, Template> = {
  home: {
    domain: 'home',
    label: 'Home paint',
    available: true,
    blurb: 'Wall, trim, and cabinet colours, room by room.',
    tiers: { project: 'Home', part: 'Room', entry: 'Paint' },
    steps: false,
    entryFields: [
      { key: 'name', label: 'Colour name', placeholder: 'Pale Oak' },
      { key: 'brand', label: 'Brand', datalist: PAINT_BRANDS },
      { key: 'code', label: 'Colour code', placeholder: 'OC-20' },
      { key: 'finish', label: 'Finish', input: 'select', options: FINISHES },
      { key: 'surface', label: 'Surface', input: 'select', options: SURFACES },
      { key: 'line', label: 'Product line', placeholder: 'Regal Select' },
      { key: 'date', label: 'Date painted', input: 'date' },
      { key: 'description', label: 'Notes', input: 'textarea' },
    ],
    specFields: ['finish', 'surface'],
  },

  wood: {
    domain: 'wood',
    label: 'Woodworking',
    available: true,
    blurb: 'Finishing schedules — the ordered recipe is the record.',
    tiers: { project: 'Project', part: 'Piece', entry: 'Finish' },
    steps: true,
    stepRoles: WOOD_STEP_ROLES,
    entryFields: [
      { key: 'name', label: 'Finish name', placeholder: 'Oiled & waxed' },
      { key: 'type', label: 'Finish type', input: 'select', options: WOOD_FINISH_TYPES },
      { key: 'finish', label: 'Sheen', input: 'select', options: WOOD_SHEEN },
      { key: 'date', label: 'Date', input: 'date' },
      { key: 'description', label: 'Result notes', input: 'textarea', placeholder: 'Colour shift, blotching, how it aged…' },
    ],
    partFields: [
      { key: 'extra:species', label: 'Wood species', datalist: WOOD_SPECIES },
    ],
    specFields: ['type', 'finish'],
  },

  minis: {
    domain: 'minis',
    label: 'Miniatures',
    available: false,
    blurb: 'Per-area recipes: prime, base, wash, layer, highlight.',
    tiers: { project: 'Army', part: 'Model', entry: 'Recipe' },
    steps: true,
    stepRoles: MINI_STEP_ROLES,
    entryFields: [
      { key: 'name', label: 'Area', placeholder: 'Armour' },
      { key: 'description', label: 'Notes', input: 'textarea' },
    ],
    partFields: [
      { key: 'extra:primer', label: 'Primer', datalist: ['Wraithbone', 'Grey Seer', 'Chaos Black', 'Corax White', 'Zenithal'] },
      { key: 'extra:faction', label: 'Faction / scheme' },
    ],
    specFields: [],
  },

  scale: {
    domain: 'scale',
    label: 'Scale models',
    available: false,
    blurb: 'Code-forward paints with thinner ratios and weathering steps.',
    tiers: { project: 'Build', part: 'Part', entry: 'Paint' },
    steps: true,
    stepRoles: SCALE_STEP_ROLES,
    codeFirst: true,
    entryFields: [
      { key: 'code', label: 'Paint code', placeholder: 'XF-1' },
      { key: 'name', label: 'Colour name' },
      { key: 'brand', label: 'Brand', datalist: SCALE_BRANDS },
      { key: 'extra:reference', label: 'Reference standard', placeholder: 'RAL 9005 / FS 36118' },
      { key: 'description', label: 'Notes', input: 'textarea' },
    ],
    specFields: ['brand'],
  },

  ceramics: {
    domain: 'ceramics',
    label: 'Ceramics / glazes',
    available: false,
    blurb: 'Glaze layers, cone & atmosphere, fired-result swatch.',
    tiers: { project: 'Collection', part: 'Piece', entry: 'Glaze' },
    steps: true,
    stepRoles: CERAMIC_METHOD,
    swatchApprox: true,
    entryFields: [
      { key: 'name', label: 'Glaze name' },
      { key: 'extra:cone', label: 'Cone', input: 'select', options: CERAMIC_CONES },
      { key: 'extra:atmosphere', label: 'Atmosphere', input: 'select', options: CERAMIC_ATMOS },
      { key: 'extra:clay', label: 'Clay body' },
      { key: 'description', label: 'Result notes', input: 'textarea', placeholder: 'Surface, defects, repeat next time…' },
    ],
    specFields: ['extra:cone', 'extra:atmosphere'],
  },

  auto: {
    domain: 'auto',
    label: 'Automotive',
    available: false,
    blurb: 'OEM paint code first, then the refinish system.',
    tiers: { project: 'Vehicle', part: 'Panel', entry: 'Paint' },
    steps: true,
    stepRoles: ['Primer', 'Base / colour', 'Midcoat (tri-coat)', 'Clear'],
    codeFirst: true,
    entryFields: [
      { key: 'code', label: 'OEM paint code', placeholder: 'WA8624' },
      { key: 'name', label: 'Colour name' },
      { key: 'extra:system', label: 'Paint system', input: 'select', options: AUTO_SYSTEMS },
      { key: 'brand', label: 'Refinish brand', datalist: AUTO_BRANDS },
      { key: 'extra:codeLocation', label: 'Code location', placeholder: 'Driver door jamb' },
      { key: 'description', label: 'Notes', input: 'textarea' },
    ],
    specFields: ['extra:system'],
  },
}

export const DOMAIN_ORDER: Domain[] = ['home', 'wood', 'minis', 'scale', 'ceramics', 'auto']

export function getTemplate(domain: Domain): Template {
  return TEMPLATES[domain] ?? TEMPLATES.home
}
