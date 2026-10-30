# Nexora Operations — Angular client

The reference application's Angular client (`@slotted/demo-nexora-angular`), written as a
consumer of the published packages. Domain and scope: `demos/nexora/domain.md` at the
repository root.

## Installation contract

Every `@slotted/*` dependency is a tarball from `../../.registry`, written by `pnpm pack:beta` at
the repository root. The simulated backend, `@slotted/demo-nexora-backend`
(`../nexora-operations`), links by workspace and runs in-process in the browser.

```sh
# at the repository root
pnpm pack:beta        # once, and after every library change worth consuming
pnpm install

# here
pnpm start            # http://localhost:4250, also on 0.0.0.0 and devserver.local
pnpm test
pnpm build:demo
```

| Package                              | Role                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `@slotted/angular`                   | components, one secondary entry point per family; CSS inlined per component                 |
| `@slotted/core`                      | peer dependency of `@slotted/angular`, installed explicitly                                 |
| `@slotted/themes`                    | token values per theme, scheme and density; the only stylesheet imported                    |
| `@slotted/demo-nexora-backend`    | the simulated backend, by workspace link; `scale: 'light'` by default, `?scale=demo` in the URL |
| `@fontsource-variable/geist`, `-mono`| the faces the theme names; the theme ships no font                                          |
| `@ng-icons/core`, `@ng-icons/lucide` | the glyphs; the library ships no icon catalogue                                             |

Where each part of the contract is written:

- `src/styles.css` — `@layer slotted, app;` before any import; the theme stylesheet; the brand
  as accent tokens retuned per scheme inside `@layer app`.
- `src/index.html` — `data-slotted-theme`, `data-slotted-scheme` and `data-slotted-density` on
  `html`. Without `data-slotted-theme` no token is defined and nothing paints. The scheme is only
  ever an attribute: the theme reads no `prefers-color-scheme`.
- `src/app/app.config.ts` — `provideNexoraBackend()`, and one `provide*Defaults` per family that
  speaks, with English messages.
- `angular.json` › `serve.options.prebundle.exclude` — the backend is TypeScript source; Vite's
  optimizer cannot resolve its extensionless imports.

## What the Shell keeps in the browser

The backend is memory only: a reload re-seeds. The client keeps, in `localStorage`, the active
persona and scenario (`nexora:demo`), preferences per user (`nexora:preferences:<userId>`),
recent search hits and the navigation state. `?scale=light|demo` on the URL picks the seed size.

## Reporting a problem seen here

A fault in this app is either the UI kit's or this app's. The `demo-triage` skill
(`.claude/skills/demo-triage/SKILL.md`) decides which, with evidence, and fixes it on the right
side; `LIBRARY-FEEDBACK.md` is the ledger of what the library had to answer for.

## Seeing a library change here

At the repository root, `pnpm demo:refresh` builds the four packages this app consumes, repacks
them at the current beta version, reinstalls and deletes `.angular/cache`, where the dev server
keeps its pre-bundled copy of them; restart `pnpm start` afterwards. `pnpm pack:beta`
does the same for every package, after a full build.

## Moving to a newer beta

1. At the repository root: `pnpm release` (CONTRIBUTING.md › Publishing to npm), then
   `pnpm pack:beta`, which packs the new version into `demos/.registry/`.
2. Here: replace the version in the `file:` specifiers in `package.json`, then
   `pnpm --dir demos/nexora install` at the root.
3. Build. What broke is an API change the library has to answer for — in
   `LIBRARY-FEEDBACK.md`, in a migration note, or by reverting it.

## Screenshots

With `pnpm start` running, `node tools/shoot.mjs <url> <out.png> [dark]` captures a page through
headless Chrome; `screenshots/` is git-ignored. `node tools/phone.mjs <url> <out.png> [width]
[height] [js]` captures the page as a phone — device scale 3, touch, mobile user agent — which is
what a narrow window is not: with `pointer: coarse` every control grows to its touch target, and
that is where the header, the row actions and the placeholders broke first. The optional `js`
runs before the capture and its value is printed, with a list of any element wider than the
viewport.

`node tools/jump.mjs <url> '<selector>' [width] [height]` measures one box while the screen is
loading and again once it has loaded. It answers the checklist item of the `loading-states`
skill that a picture cannot: a `top` that moves is the page jumping under the reader, and a
`height` that shrinks is a reservation that was too big. A box that grows downward is allowed —
a section that exists on some records and not on others is not reserved.
`PERSONA=<key>`, `SCENARIO=<id>` and `TOUCH=1` sign the demo in as a persona, in a scenario, on
an emulated phone before the first document: a screen a default persona may not open is measured
as the persona who can.

`node tools/look.mjs <url> <out.png> [width] [height] [persona] [scenario] [desk|phone]
[light|dark] [js]` captures a page as one persona in one scenario and prints the elements wider
than the viewport and, on a phone, every control under 44 pixels.

`node tools/journey-b.mjs` walks Journey B (§20) on an emulated phone in one browser session — a
purchase order from a position below its reorder point, its approval by the procurement lead,
the send, a partial receipt with damaged and rejected units, the stock, the ledger and the back
gesture — switching persona through the demo panel, and prints one PASS or FAIL per step. `W`
and `H` set the viewport (390×844 by default).
