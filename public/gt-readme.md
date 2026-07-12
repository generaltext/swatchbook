# Swatchbook

The anti-throwaway colour tracker: one place to keep every colour and finish decision you
make — across homes, workshops, and hobbies — as plaintext files you own and can read for
decades. No ads, no tracking, no brand lock-in. Most people record this in a notebook they
lose or an app that's gone in three years. This one is just files, forever.

## What it's for

The real unit isn't *a wall* — it's *a colour or finish choice, from some catalogue, applied
to a specific physical thing, that you'll want to match or reproduce years later.* Walls are
the most common version, but painting furniture, finishing wood, painting miniatures, glazing
a pot, or touching up a car are all the same shape of problem. Swatchbook holds all of it in
one searchable shelf.

## How it works

Three tiers, the same for every domain:

- **Project** — the container, and where the domain is set (a home, a shop build, an army…).
- **Part** — a room, a piece, a model, a panel.
- **Entry** — one colour or finish decision: the chip card you see in the grid.

Pick a **domain** when you create a project and Swatchbook relabels the tiers and chooses the
fields that matter. Home paint and woodworking are built today; miniatures, scale models,
ceramics, and automotive are on the way and already part of the format.

- **The chip card.** A colour swatch with a printed spec footer. All text lives in the footer,
  so a missing or approximate swatch never breaks the card.
- **The offline swatch.** Eyeball-match a wall, a leftover can, or a physical chip with the
  native colour picker, or paste a hex if you know it. There is **no network lookup, ever** —
  "no colour yet" is a proper first-class state, and a swatch can be flagged *approximate* when
  it only represents the real result (e.g. a fired glaze you can't photograph).
- **Recipe steps.** A wall is usually one colour, but a finish is often a sequence: sand → oil
  → wax; base → wash → highlight. Entries carry an ordered, optional recipe.

## Your data — the canonical format

Everything is stored as line-oriented **JSONL** (one JSON object per line) in your workspace,
so it syncs across your devices, merges cleanly, and stays readable by any tool. The format is
the actual product; the app is a window onto it.

```
v1/projects.jsonl     one Project per line
v1/parts.jsonl        one Part per line
v1/entries.jsonl      one Entry per line
```

A file written under one domain reads fine under any other — templates are only a presentation
layer over these records.

**Project**

```json
{"id":"…","name":"Maple Street House","subtitle":"412 Maple St","domain":"home","created":"…","updated":"…"}
```

**Part**

```json
{"id":"…","projectId":"…","name":"Tabletop","extra":{"species":"Black walnut"},"created":"…","updated":"…"}
```

**Entry** — a stable core plus two extension points (`steps` and `extra`):

```json
{
  "id":"…","partId":"…",
  "name":"Oiled & waxed",
  "brand":"","code":"","hex":"#5a4632","approx":false,
  "finish":"Satin","line":"","type":"Danish oil","surface":"",
  "date":"2026-05-03",
  "description":"…",
  "steps":[{"role":"Sand","product":"120 → 220 grit"},{"role":"Finish coat","product":"Watco Danish Oil","brand":"Watco","note":"2 coats"}],
  "extra":{},
  "created":"…","updated":"…"
}
```

Conventions:

- **Dates** are ISO `YYYY-MM-DD`; `created`/`updated` are full ISO timestamps. `date` defaults
  to the day the entry was created.
- **`steps`** is an ordered list — render order is the application order. Each step is
  `{role, product?, brand?, code?, hex?, note?}`. Empty or absent for single-colour entries.
- **`extra`** holds domain-specific fields keyed by documented ids (e.g. `species`, `cone`,
  `atmosphere`, `reference`), so the core schema stays stable and forward-compatible.
- **`hex`** is optional; an empty/absent hex means "no colour yet". `approx: true` marks a
  swatch that only represents the real result.
- **Versioning** is by folder (`v1/`). The major matches a breaking format change; the app
  migrates older data forward.

## Export

**Export** writes the same data as **CSV** (one readable row per entry), structured **JSON**, or
the canonical **JSONL**. Nothing leaves your device unless you choose to export it.

## Source

Swatchbook is open source: [github.com/generaltext/swatchbook](https://github.com/generaltext/swatchbook).
