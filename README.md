# DOM Lab

DOM Lab is a Cloudflare Workers app for cataloging and running modern browser security experiments.

Live app: https://dom-lab.skepticfx.com

DOM Lab focuses on the 2026 browser attack surface: DOM sinks, parser differentials, isolation primitives, capability APIs, storage boundaries, URL canonicalization, message channels, and weird corners where security bugs tend to hide.

- Cloudflare Worker edge shell.
- Static assets served from `site/`.
- Seed security experiments stored in `site/data/modules.json`.
- Local-first custom experiments and run results stored in the browser.
- Sandboxed iframe execution for experiment runs.
- A small service worker for offline-friendly repeat visits.

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

## Deployment

Wrangler deploys the Worker named `dom-lab` and attaches the custom domain:

```txt
dom-lab.skepticfx.com
```
