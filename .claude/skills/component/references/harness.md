# Component harness

The harness renders the one authored family stylesheet against framework-free markup. It is faithful because React and Angular consume that same CSS; it is fast enough to support repeated visual correction.

## Commands

Build `tools/harness/out/<family>.html`:

```bash
node tools/harness/build.mjs <family>
```

If the default theme has not been built, run `pnpm --filter @slotted/themes build` once and rebuild the harness.

Capture one combination at twice the device scale. Every axis is named, and each defaults to the first value listed:

```bash
node tools/harness/shoot.mjs <family> \
  --scheme <light|dark|high-contrast> \
  --width <420|240|720> \
  --density <comfortable|compact|dense> \
  --dir <ltr|rtl> \
  --scene <name> \
  --focus <css selector> \
  --out <directory>
```

`--focus` puts focus on the first element the selector matches inside the
captured cell, after a Tab press that makes Chrome treat the interaction as a
keyboard one, so `:focus-visible` and `:focus-within` are photographed rather
than described. The selector reaches the file name as a slug, so two focus
targets in one combination produce two images.

The capture is the whole page, not the window: the shooter drives Chrome through the DevTools protocol and clips to the document's own height. A family with many scenes therefore produces one tall image, so `--scene` narrows it to a single scene when a detail needs to fill the view.

The shooter prints the PNG's absolute path, and the name states every axis. Its default output directory is `$TMPDIR` or `/tmp`. Always read the image; file existence and size do not distinguish the component from a browser error page.

## Specimen

A picture shows what a reader notices; a specimen holds the numbers. It is the
computed styles of one page, written as JSON beside a full-page picture:

```bash
node tools/harness/specimen.mjs --family <family> \
  --theme <light|dark|high-contrast> --width <420|240|720> \
  --density <comfortable|compact|dense> --dir <ltr|rtl> \
  --motion <no-preference|reduce> --forced-colors <none|active> \
  --click <selector> --states <selector> --limit <n>
```

The same tool reads a reference page on the web, so a surveyed implementation
and the family are compared with one property list:

```bash
node tools/harness/specimen.mjs --url <https page> --name <name> \
  --ready <selector the page sets once painted> --missing-text <text of its 404 page> \
  --theme <light|dark> --width <px> --states <selector>
```

The record lists every `data-ui`, `data-part` and `data-slot` element, their
direct children, every `svg` and every interactive element, with rect, data and
aria attributes, `focusable`, `ground` (the first opaque background behind it),
56 computed properties, and the same properties for a `::before` or `::after`
that paints. `--states` adds, for its first `--limit` rendered matches (default
6), the computed delta and a clipped picture of hover, press and keyboard focus
against rest; `deltas.focus` is `null` on an element that cannot take focus.
`--click` reaches a state behind an interaction by real clicks, in order, before
anything is read. Chrome runs with a fine pointer, so hover rules gated on
`@media (hover: hover)` apply.

Output goes to `tools/harness/out/specimen/<family or name>/`; every axis away
from its default and every selector enter the file name. The tool exits 1 when a
reference answers other than 200, shows its missing text, never matches
`--ready` after one reload, or when a `--click` or `--states` selector matches
nothing. Read the JSON with a script and print only the rows a decision needs.

## Fragment contract

Author `packages/styles/src/<family>/<family>.harness.html` as one or more scenes:

```html
<section data-scene="default">
  <!-- the family DOM for this scene -->
</section>
```

Scene names must be unique and stable. The builder emits every scene in `light`, `dark` and `high-contrast` at 240, 420, and 720 pixels. Density and direction are applied to the whole page from the query, not multiplied into cells. Open the generated HTML without a query to review the full matrix.

Every `data-part` in `specs/components/<family>/contract.json` must appear in at least one scene. Exercise every declared state, plus content lengths and combinations that can alter layout. Include a deep or long-content scene when the family can wrap, truncate, collapse, or overflow.

The fragment is a third place where the DOM is written, after React and Angular. It can drift. Re-read it whenever either framework's markup changes, then compare its `data-part` values, relationships, attributes, and states to both implementations and the contract.

## Visual loop

At minimum capture light at 420, dark at 420, light at 240, high contrast at 420, dense at 420, and RTL at 420. Capture `--focus` for every state a family paints only while focus is on it. Also inspect 720 pixels whenever width affects composition. Read every capture at full size and compare it to the prior iteration.

Check alignment, spacing rhythm, optical balance, type, contrast, focus treatment, glyph geometry, long content, the narrow-width decision, whether density changes size without changing meaning, and whether the mirrored layout is the same component rather than a rearranged one. Correct the source, rebuild, and recapture every affected combination. Stop only when the picture and live interactions meet `rubric.md`.

A blank capture usually means the page's query filter and builder ID pattern disagree. An `ERR_FILE_NOT_FOUND` capture means the shooter did not give Chrome a valid `file:` URL. Resolve either problem before judging the component.
