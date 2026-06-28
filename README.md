# DOM Lab

DOM Lab is a Cloudflare Workers app for cataloging and running browser behavior experiments.

Live app: https://dom-lab.skepticfx.com

This is a modernized rebuild of the original DomStorm idea. The old Express, MongoDB, EJS, Bootstrap, jQuery, and Twitter OAuth runtime has been replaced with:

- A Cloudflare Worker edge shell.
- Static assets served from `site/`.
- Seed experiments stored in `site/data/modules.json`.
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

The Worker keeps legacy routes such as `/modules?id=...` and `/modules/run?id=...` redirecting into the new app.
