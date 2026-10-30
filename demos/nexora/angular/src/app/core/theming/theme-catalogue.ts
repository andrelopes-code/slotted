import type { ButtonChoice, FocusChoice, FontId, InputChoice } from './customization';

/**
 * The themes a reader can choose from, as data: what the store and the
 * preferences page need before any theme is compiled. The definitions are in
 * `nexora-themes.ts`, which only `PreferencesStore.useThemes` and the
 * appearance section load, so `extendTheme` and the default theme object stay
 * out of the initial bundle.
 */
export interface ThemeEntry {
  readonly id: string;
  readonly label: string;
  /** The theme's character, in one line. */
  readonly description: string;
  /**
   * The accent `html` carries while the reader keeps the theme's own brand,
   * `#rrggbb`; `null` leaves the seed the theme's sheet declares.
   */
  readonly accent: string | null;
  /** The theme's own largest corner, in px: where the builder's corner slider starts. */
  readonly radius: number;
  /** The theme's own faces for the text and the headings, as the font pickers name them. */
  readonly body: FontId;
  readonly heading: FontId;
  /**
   * The face of running text — the typography family's paragraphs — where it
   * is not the body face; `body` stays the face of the controls, the tables
   * and the labels.
   */
  readonly prose: FontId | null;
  /** The theme's own input, focus and button styles: what each Controls axis's "Theme" keeps. */
  readonly controls: {
    readonly input: InputChoice;
    readonly focus: FocusChoice;
    readonly button: ButtonChoice;
  };
}

export const DEFAULT_THEME_ID = 'default';

export const THEME_CATALOGUE: readonly ThemeEntry[] = [
  {
    id: DEFAULT_THEME_ID,
    label: 'Standard',
    description: 'The library’s own theme in Nexora violet: Geist, compact corners, quiet shadows.',
    accent: '#7c3aed',
    radius: 8,
    body: 'geist',
    heading: 'geist',
    prose: null,
    controls: { input: 'outlined', focus: 'ring', button: 'solid' },
  },
  {
    id: 'nexora-precise',
    label: 'Precise',
    description:
      'Dense and exact: 13 px Inter, hairlines, soft-filled fields, a glow on focus, mono labels.',
    accent: null,
    radius: 8,
    body: 'inter',
    heading: 'inter',
    prose: null,
    controls: { input: 'borderless', focus: 'glow', button: 'solid' },
  },
  {
    id: 'nexora-editorial',
    label: 'Editorial',
    description:
      'A page to read: serif text and display headings, ruled fields, ink rules, no shadows.',
    accent: null,
    radius: 2,
    body: 'source-sans',
    heading: 'fraunces',
    prose: 'source-serif',
    controls: { input: 'underline', focus: 'underline', button: 'outline' },
  },
  {
    id: 'nexora-corporate',
    label: 'Corporate',
    description:
      'Forms and tables at 40 px: Source Sans 3, strong field borders, banded heads, offset focus.',
    accent: null,
    radius: 6,
    body: 'source-sans',
    heading: 'source-sans',
    prose: null,
    controls: { input: 'outlined', focus: 'offset', button: 'solid' },
  },
  {
    id: 'nexora-expressive',
    label: 'Expressive',
    description:
      'Rounded and tonal: Outfit, pill buttons, filled fields, large corners, springy motion.',
    accent: null,
    radius: 24,
    body: 'outfit',
    heading: 'outfit',
    prose: null,
    controls: { input: 'filled', focus: 'ring', button: 'solid' },
  },
];

/** The themes compiled at runtime; `default` is the sheet `styles.css` imports. */
export const RUNTIME_THEME_IDS: readonly string[] = THEME_CATALOGUE.filter(
  (entry) => entry.id !== DEFAULT_THEME_ID,
).map((entry) => entry.id);

/**
 * The builder's output, under two names: the saved customization, and the
 * candidate the preferences page is editing. `html` names the candidate while
 * the page is open, so the whole application is drawn in it before Save;
 * Discard and leaving the page bring back `html` naming the saved one.
 */
export const CUSTOM_THEME_ID = 'nexora-custom';
export const DRAFT_THEME_ID = 'nexora-custom-draft';

/** The catalogue entry for `id`, or the default's when the catalogue no longer has it. */
export function catalogueTheme(id: unknown): ThemeEntry {
  return THEME_CATALOGUE.find((entry) => entry.id === id) ?? THEME_CATALOGUE[0]!;
}
