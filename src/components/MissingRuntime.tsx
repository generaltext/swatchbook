import { ExternalLink, Play, SwatchBook } from 'lucide-react'

// The landing page, shown when Swatchbook is opened on its own (no injected
// `window.gt` runtime — e.g. visiting the deployed site directly rather than
// launching it from a workspace). A gt app has no backend of its own, so there's
// nothing to read or write here; instead this explains what Swatchbook is, shows
// what it looks like, points the visitor at how to install it, and offers a
// local sample-data demo. It deliberately does NOT drop straight into the demo.
//
// Standalone there's no shell theme to follow, so this is its own self-contained
// "Fan Deck" identity using the palette variables from global.css (light).

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif'

export default function MissingRuntime({ onTryDemo }: { onTryDemo: () => void }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://swatchbook.generaltext.org'

  return (
    <div className="min-h-full overflow-y-auto bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <SwatchBook size={24} className="text-[var(--accent)]" />
          <span className="text-[17px] font-semibold tracking-tight">Swatchbook</span>
          <span className="text-sm text-[var(--ink-3)]">· A General Text app</span>
        </div>

        {/* hero */}
        <div className="mt-10 grid items-center gap-10 md:mt-14 md:grid-cols-[1.05fr_1fr]">
          <div>
            <h1
              className="text-balance text-[clamp(34px,6vw,52px)] font-semibold leading-[1.04] tracking-tight"
              style={{ fontFamily: SERIF }}
            >
              One chip, every craft.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-[var(--ink-2)]">
              A lifelong, plaintext record of every colour and finish decision you make — across
              homes, workshops, and hobbies. The anti-throwaway colour tracker: just files you own
              and can read for decades. No ads, no tracking, no brand lock-in.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="https://www.generaltext.org"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
              >
                Open General Text
                <ExternalLink size={15} />
              </a>
              <button
                type="button"
                onClick={onTryDemo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Play size={15} />
                Try the live demo
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--ink-3)]">
              The demo loads sample projects locally in your browser — nothing is saved to an
              account, and changes stay on this device.
            </p>
          </div>

          {/* sample chips — the product, on sight */}
          <div className="grid grid-cols-2 gap-3.5" aria-hidden="true">
            <Chip hex="#e7e2d6" name="Pale Oak" brand="Benjamin Moore" code="OC-20" spec="Eggshell · Walls" />
            <Chip hex="#2e3a4b" name="Naval" brand="Sherwin-Williams" code="SW 6244" spec="Satin · Cabinets" />
            <Chip
              hex="#5a4632"
              name="Oiled & waxed"
              spec="Danish oil · Satin"
              steps={[
                ['Sand', '120 → 220 grit'],
                ['Oil', 'Watco · 2 coats'],
                ['Wax', 'Briwax clear'],
              ]}
            />
            <Chip hex="#323e48" name="Hague Blue" brand="Farrow & Ball" code="No. 30" spec="Matte · Walls" />
          </div>
        </div>

        {/* what it is */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line-soft)] sm:grid-cols-3">
          <Feature title="The chip card" body="A colour swatch with a printed spec footer — the signature unit. Eyeball-match a colour or paste a hex; “no colour yet” is fine too." />
          <Feature title="One format, many crafts" body="Home paint, woodworking finishes, and more to come. The same plaintext format underneath; the labels and fields change per craft." />
          <Feature title="Yours, forever" body="Everything is plain JSONL files in your workspace, syncing across your devices. Export anytime. Readable long after any app is gone." />
        </div>

        {/* install */}
        <div className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
            To use Swatchbook
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            <Step n={1}>
              Open <Link href="https://www.generaltext.org">General Text</Link> and create or open a
              workspace.
            </Step>
            <Step n={2}>
              Go to <span className="font-medium text-[var(--ink)]">Settings → Apps → Install by URL</span>.
            </Step>
            <Step n={3}>
              Paste this app's address:
              <code className="mt-1 block w-fit rounded bg-[var(--panel-2)] px-2 py-1 font-mono text-xs text-[var(--ink-2)]">
                {appUrl}
              </code>
            </Step>
            <Step n={4}>Launch Swatchbook from your workspace.</Step>
          </ol>
        </div>

        {/* footer */}
        <p className="mt-10 text-xs text-[var(--ink-3)]">
          Open source: <Link href="https://github.com/generaltext/swatchbook">github.com/generaltext/swatchbook</Link>
          {' · '}
          Building your own app? <Link href="https://www.generaltext.org/docs/building-apps">Read the developer guide</Link>.
        </p>
      </div>
    </div>
  )
}

function Chip({
  hex,
  name,
  brand,
  code,
  spec,
  steps,
}: {
  hex: string
  name: string
  brand?: string
  code?: string
  spec?: string
  steps?: [string, string][]
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_18px_-14px_rgba(40,30,20,0.5)]">
      <div className="relative flex h-20 items-end justify-end p-2" style={{ background: hex }}>
        {code && (
          <span className="rounded bg-white/82 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-neutral-800 ring-1 ring-black/5">
            {code}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-3.5 pb-3.5 pt-2.5">
        <div className="text-[13.5px] font-semibold leading-tight">{name}</div>
        {brand && <div className="text-[11px] text-[var(--ink-2)]">{brand}</div>}
        {spec && <div className="mt-0.5 text-[11px] text-[var(--ink-3)]">{spec}</div>}
        {steps && (
          <div className="mt-2 flex flex-col gap-1 border-t border-dashed border-[var(--line)] pt-2">
            {steps.map(([role, prod]) => (
              <div key={role} className="flex items-baseline gap-2 text-[11px]">
                <span className="w-9 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                  {role}
                </span>
                <span className="min-w-0 text-[var(--ink-2)]">{prod}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[var(--panel)] p-5">
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-3)]">{body}</p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent-deep)]">
        {n}
      </span>
      <span className="min-w-0 flex-1 text-sm text-[var(--ink-2)]">{children}</span>
    </li>
  )
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="font-medium text-[var(--accent-deep)] underline decoration-[var(--line)] underline-offset-2 hover:decoration-[var(--accent)]"
    >
      {children}
    </a>
  )
}
