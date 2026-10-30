import type { FontFaceDefinition } from '@slotted/theme';

import type { FontId } from './customization';

/**
 * The families the themes and the builder choose from. Geist and Geist Mono
 * come with `styles.css`; the other seven are copied from their
 * `@fontsource-variable` packages to `/fonts/` by the build (`angular.json`),
 * declared in the `fonts` of the themes that use them, and downloaded by the
 * browser the first time a glyph is drawn in them.
 */
export interface FontFamily {
  readonly id: FontId;
  readonly label: string;
  /** What kind of face it is, in a few words. */
  readonly kind: string;
  /** The `font-family` stack a token names, the face first. */
  readonly stack: string;
  /** The `@font-face` a theme declares to use it; `null` for Geist, which `styles.css` declares. */
  readonly face: FontFaceDefinition | null;
}

const face = (family: string, file: string, weight: string): FontFaceDefinition => ({
  family,
  src: `url('/fonts/${file}-latin-wght-normal.woff2') format('woff2-variations')`,
  weight,
  display: 'swap',
});

const SANS = 'ui-sans-serif, system-ui, sans-serif';

export const FONT_FAMILIES: readonly FontFamily[] = [
  {
    id: 'geist',
    label: 'Geist',
    kind: 'Neutral sans',
    stack: `'Geist Variable', ${SANS}`,
    face: null,
  },
  {
    id: 'inter',
    label: 'Inter',
    kind: 'Workhorse sans',
    stack: `'Inter Variable', ${SANS}`,
    face: face('Inter Variable', 'inter', '100 900'),
  },
  {
    id: 'nunito',
    label: 'Nunito',
    kind: 'Rounded sans',
    stack: `'Nunito Variable', ui-rounded, ${SANS}`,
    face: face('Nunito Variable', 'nunito', '200 1000'),
  },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    kind: 'Humanist sans',
    stack: `'Source Sans 3 Variable', ${SANS}`,
    face: face('Source Sans 3 Variable', 'source-sans-3', '200 900'),
  },
  {
    id: 'outfit',
    label: 'Outfit',
    kind: 'Geometric sans',
    stack: `'Outfit Variable', ${SANS}`,
    face: face('Outfit Variable', 'outfit', '100 900'),
  },
  {
    id: 'source-serif',
    label: 'Source Serif 4',
    kind: 'Text serif',
    stack: "'Source Serif 4 Variable', 'Iowan Old Style', Charter, Georgia, serif",
    face: face('Source Serif 4 Variable', 'source-serif-4', '200 900'),
  },
  {
    id: 'fraunces',
    label: 'Fraunces',
    kind: 'Display serif',
    stack: "'Fraunces Variable', Georgia, serif",
    face: face('Fraunces Variable', 'fraunces', '100 900'),
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    kind: 'Monospace',
    stack: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace",
    face: face('JetBrains Mono Variable', 'jetbrains-mono', '100 800'),
  },
];

export function fontFamily(id: FontId): FontFamily {
  return FONT_FAMILIES.find((family) => family.id === id)!;
}

/** The `@font-face` declarations the families `ids` need, each once. */
export function facesOf(...ids: FontId[]): FontFaceDefinition[] {
  return [
    ...new Set(ids.map((id) => fontFamily(id).face).filter((face) => face !== null)),
  ] as FontFaceDefinition[];
}

/**
 * Declares every family's face on `document` through the CSS Font Loading
 * API, so the font picker can draw each option in its own face; a face loads
 * when a glyph is first drawn in it. Declared once per document; a browser
 * without the API keeps the fallbacks of each stack.
 */
export function declareFaces(document: Document): void {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  const FontFaceType = document.defaultView?.FontFace;
  if (fonts === undefined || FontFaceType === undefined) return;
  const declared = new Set([...fonts].map((font) => font.family.replace(/^["']|["']$/g, '')));
  for (const family of FONT_FAMILIES) {
    if (family.face === null || declared.has(family.face.family)) continue;
    const url = /url\('([^']+)'\)/.exec(family.face.src)![1]!;
    fonts.add(
      new FontFaceType(family.face.family, `url(${url})`, {
        weight: family.face.weight,
        display: 'swap',
      }),
    );
  }
}
