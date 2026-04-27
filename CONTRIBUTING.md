# Contributing / Development

## Prerequisites

- Node.js 20+

## Setup

```sh
git clone <repo>
cd wallet-sign-tool
npm install
```

## Build

```sh
npm run build
```

This runs three steps in sequence:

1. `tsc -p tsconfig.cli.json` — compiles `src/cli.ts` → `bin/cli.js`
2. `vite build --config vite.lib.config.ts` — bundles `src/index.ts` → `dist/index.js` (library, ethers external)
3. `tsc -p tsconfig.lib.json` — emits `dist/index.d.ts`, `dist/signer.d.ts`, `dist/types.d.ts`

## Dev server

```sh
npm start
```

Starts Vite at `http://localhost:5173`. Uses the `wallet-sign-tool.config.js` in the repo root as the local test config.

## Project structure

```
src/
  index.ts      Library entry point — re-exports createSigner + all types
  signer.ts     createSigner(config) factory
  types.ts      Exported TypeScript types
  types.d.ts    Ambient declarations (virtual:wst-config module)
  main.ts       Browser entry for the standalone CLI UI
  cli.ts        Node.js CLI — compiled by tsc → bin/cli.js
bin/
  cli.js        Compiled CLI binary (committed; published)
dist/
  index.js      Library bundle (ES module, ethers external)
  index.d.ts    Library type declarations
index.html      Standalone signing UI served by the CLI
vite.config.ts      Vite config for local dev (standalone UI)
vite.lib.config.ts  Vite config for library build
tsconfig.json       Browser / Vite TypeScript config
tsconfig.cli.json   CLI TypeScript config (NodeNext)
tsconfig.lib.json   Library declarations config
wallet-sign-tool.config.js  Local test config (not published)
```

## Why two tsconfigs?

| | `tsconfig.json` | `tsconfig.cli.json` |
|--|--|--|
| `moduleResolution` | `bundler` | `NodeNext` |
| `lib` | `ES2022, DOM` | `ES2022` |
| `outDir` | — (Vite handles emit) | `bin/` |
| `include` | `src/` | `src/cli.ts` only |

`moduleResolution: bundler` lets Vite resolve imports without file extensions and handle virtual modules. Node.js requires `NodeNext` which enforces explicit `.js` extensions and standard ESM resolution.

## Why can't Vite compile the CLI?

The CLI calls `createServer`, `build`, and `preview` from Vite programmatically. Bundling the CLI with Vite would mean Vite bundling itself — circular and unnecessary. `tsc` is the right tool for a Node.js script that has no browser concerns.

## Publishing

```sh
npm run build
npm publish --access public
```

The `files` field in `package.json` limits what's published to `bin/`, `src/`, and `index.html`.
