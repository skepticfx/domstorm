# DOM Lab

DOM Lab is a Cloudflare Workers app for cataloging and running modern browser security experiments.

Live app: https://dom-lab.skepticfx.com

DOM Lab focuses on the 2026 browser attack surface: DOM sinks, parser differentials, isolation primitives, capability APIs, storage boundaries, URL canonicalization, message channels, and weird corners where security bugs tend to hide.

## What Is Included

- Cloudflare Worker edge shell.
- Static assets served from `site/`.
- Seed security experiments stored in `site/data/modules.json`.
- Local-first custom experiments and run results stored in the browser.
- Sandboxed iframe execution for experiment runs.
- A small service worker for offline-friendly repeat visits.

## Security Probe Catalog

The seed catalog includes probes for:

- Trusted Types and DOM sink coverage.
- Sanitizer and safe HTML API availability.
- DOM clobbering and named property lookup.
- Window, realm, and WindowProxy entrypoints.
- postMessage and MessageEvent shape.
- URL canonicalization and allowlist bypass traps.
- HTML, SVG, MathML, template, and Declarative Shadow DOM parsing.
- Cross-origin isolation and capability-gated APIs.
- Storage partitioning, cookie prefixes, and privacy boundaries.
- Navigation API, URLPattern, BFCache-related surfaces, and router assumptions.
- Permission-gated capability APIs such as clipboard, credentials, USB, serial, HID, file picker, and payment.
- CSSOM parsing surfaces including `:has`, `@property`, `@scope`, and container queries.
- Prototype pollution gadget hunting in DOM-facing option bags.
- Structured clone brand checks.
- WebAssembly validation boundaries.
- Scheduler and timing primitives for race and XS-Leak research.
- Import maps, speculation rules, modulepreload, and module-era script resolution.

The examples are designed to expose browser behavior and portability traps without shipping exploit chains.

## Commands

```sh
npm install
npm run check
npm run dev
npm run dry-run
npm run deploy
```

## Experiment API

Experiments define a `function test(data)` in JavaScript. The runner provides:

- `addSuccess(...values)`
- `addInfo(...values)`
- `addError(...values)`
- `addResult(...values)`

Enum experiments provide JavaScript that defines a `data` array. Fuzzer experiments provide one payload per line.

## Project Layout

```txt
src/worker.js              Cloudflare Worker shell and API routes
site/                      Static frontend deployed as Workers assets
site/app.js                Local-first SPA and sandboxed runner
site/data/modules.json     Seed security probe catalog
scripts/validate.mjs       Rebrand, catalog, and Worker asset validation
wrangler.jsonc             Worker name, assets, and custom domain config
```

## Deployment

Wrangler deploys the Worker named `dom-lab` and attaches the custom domain:

```txt
dom-lab.skepticfx.com
```
