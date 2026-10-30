import { THEME_CHANGE_EVENT } from '../portal/portal';
import type { ChartColor, ChartSlot, ChartTone } from './types';

/**
 * The chart's look, read from the stylesheet rather than written in script.
 *
 * The engine draws in its own renderer and cannot read `var()`: an ECharts
 * theme is an object of resolved values. So the family stylesheet declares,
 * on the plot part, the private properties below — each one a token with its
 * fallback — and this module resolves them in the element's own context: a
 * scheme set on an ancestor, a density, a token a consumer overrode on a
 * wrapper, and the system colors of forced-colors mode all reach the engine
 * through the cascade, with no second source of truth in script.
 *
 * A custom property's computed value is its text with `var()` substituted and
 * nothing else resolved — `color-mix()`, `0.75rem` and `CanvasText` all come
 * back as written — so every value is resolved through a probe element that
 * asks the browser what it means.
 */

export interface ChartTheme {
  readonly slots: readonly string[];
  readonly tones: Readonly<Record<ChartTone, string>>;
  readonly overflow: string;
  readonly text: string;
  readonly label: string;
  readonly grid: string;
  readonly axis: string;
  readonly reference: string;
  readonly surface: string;
  readonly fontFamily: string;
  /** Pixels. */
  readonly labelSize: number;
  readonly lineWidth: number;
  readonly markerSize: number;
  readonly barRadius: number;
  readonly areaOpacity: number;
  /** The inset between the plot's edge and the marks, in pixels. */
  readonly inset: number;
  /** Milliseconds; 1 or less under reduced motion. */
  readonly duration: number;
  readonly easing: readonly [number, number, number, number];
  readonly forcedColors: boolean;
}

export const CHART_THEME_PROPERTIES = {
  text: '--_chart-text',
  label: '--_chart-label',
  grid: '--_chart-grid',
  axis: '--_chart-axis',
  reference: '--_chart-reference',
  surface: '--_chart-surface',
  overflow: '--_chart-overflow',
  labelSize: '--_chart-label-size',
  lineWidth: '--_chart-line-width',
  markerSize: '--_chart-marker-size',
  barRadius: '--_chart-bar-radius',
  areaOpacity: '--_chart-area-opacity',
  inset: '--_chart-inset',
  duration: '--_chart-duration',
  easing: '--_chart-easing',
} as const;

export const CHART_TONES: readonly ChartTone[] = [
  'neutral',
  'accent',
  'secondary',
  'info',
  'success',
  'warning',
  'danger',
];

export function slotProperty(slot: ChartSlot | number) {
  return `--_chart-slot-${slot}`;
}

export function toneProperty(tone: ChartTone) {
  return `--_chart-tone-${tone}`;
}

/** The color a legend entry or a series is painted in, from a theme. */
export function colorOf(theme: ChartTheme, color: ChartColor): string {
  if (color.type === 'tone') return theme.tones[color.tone];
  if (color.type === 'slot') return theme.slots[color.slot - 1] ?? theme.overflow;
  return theme.overflow;
}

function parseDuration(value: string) {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return 0;
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
}

function parseEasing(value: string): [number, number, number, number] {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const numbers = match?.[1]?.split(',').map((part) => Number(part.trim()));
  if (numbers?.length === 4 && numbers.every(Number.isFinite)) {
    return numbers as [number, number, number, number];
  }
  return [0.2, 0, 0, 1];
}

/**
 * Reads the theme at an element. The element is the plot part, whose
 * stylesheet declares the properties; any element under a chart's root works.
 */
function readTheme(element: Element): ChartTheme {
  const view = element.ownerDocument.defaultView!;
  const style = view.getComputedStyle(element);
  const raw = (name: string) => style.getPropertyValue(name).trim();

  const probe = element.ownerDocument.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;inline-size:0;block-size:0;overflow:hidden';
  element.appendChild(probe);
  const probeStyle = view.getComputedStyle(probe);

  const color = (name: string, fallback: string) => {
    const value = raw(name);
    probe.style.color = '';
    probe.style.color = value || fallback;
    return probeStyle.color || fallback;
  };
  const length = (name: string, fallback: number) => {
    const value = raw(name);
    if (!value) return fallback;
    probe.style.inlineSize = '';
    probe.style.inlineSize = value;
    const pixels = Number.parseFloat(probeStyle.inlineSize || probeStyle.width);
    probe.style.inlineSize = '0';
    return Number.isFinite(pixels) ? pixels : fallback;
  };
  const number = (name: string, fallback: number) => {
    const value = Number.parseFloat(raw(name));
    return Number.isFinite(value) ? value : fallback;
  };

  try {
    const text = color(CHART_THEME_PROPERTIES.text, 'CanvasText');
    return {
      slots: Array.from({ length: 8 }, (_, index) => color(slotProperty(index + 1), text)),
      tones: Object.fromEntries(
        CHART_TONES.map((tone) => [tone, color(toneProperty(tone), text)]),
      ) as Record<ChartTone, string>,
      overflow: color(CHART_THEME_PROPERTIES.overflow, 'GrayText'),
      text,
      label: color(CHART_THEME_PROPERTIES.label, 'GrayText'),
      grid: color(CHART_THEME_PROPERTIES.grid, 'GrayText'),
      axis: color(CHART_THEME_PROPERTIES.axis, 'GrayText'),
      reference: color(CHART_THEME_PROPERTIES.reference, 'GrayText'),
      surface: color(CHART_THEME_PROPERTIES.surface, 'Canvas'),
      fontFamily: style.fontFamily,
      labelSize: length(CHART_THEME_PROPERTIES.labelSize, 12),
      lineWidth: length(CHART_THEME_PROPERTIES.lineWidth, 2),
      markerSize: length(CHART_THEME_PROPERTIES.markerSize, 6),
      barRadius: length(CHART_THEME_PROPERTIES.barRadius, 4),
      areaOpacity: number(CHART_THEME_PROPERTIES.areaOpacity, 0.16),
      inset: length(CHART_THEME_PROPERTIES.inset, 8),
      duration: parseDuration(raw(CHART_THEME_PROPERTIES.duration)),
      easing: parseEasing(raw(CHART_THEME_PROPERTIES.easing)),
      forcedColors: view.matchMedia?.('(forced-colors: active)').matches ?? false,
    };
  } finally {
    probe.remove();
  }
}

/**
 * Reads the theme at an element and stores it under the element's context,
 * where `cachedChartTheme` finds it for the next chart mounted in the same
 * context.
 */
export function readChartTheme(element: Element): ChartTheme {
  const theme = readTheme(element);
  const store = storeOf(element.ownerDocument);
  const key = chartThemeKey(element);
  /* Re-inserted, so the oldest context is the first one dropped. */
  store.delete(key);
  store.set(key, theme);
  if (store.size > CACHE_LIMIT) store.delete(store.keys().next().value!);
  return theme;
}

/* ── The cache ─────────────────────────────────────────────────────────── */

/**
 * Themes already read, by the context they were read in. A read appends a
 * probe and computes two dozen styles, which forces a style recalculation of
 * whatever the page just committed; every chart under the same scheme reads
 * the same values, so a chart mounted in a context already read takes the
 * stored theme and computes no style.
 */
const stores = new WeakMap<Document, Map<string, ChartTheme>>();
const CACHE_LIMIT = 32;
/** Theme stylesheets applied at runtime per document; see `THEME_CHANGE_EVENT`. */
const generations = new WeakMap<Document, number>();

const THEME_QUERIES = [
  '(prefers-color-scheme: dark)',
  '(forced-colors: active)',
  '(prefers-reduced-motion: reduce)',
];

function storeOf(document: Document) {
  let store = stores.get(document);
  if (store === undefined) {
    store = new Map();
    stores.set(document, store);
  }
  return store;
}

function generationOf(document: Document) {
  const known = generations.get(document);
  if (known !== undefined) return known;
  generations.set(document, 0);
  document.addEventListener(THEME_CHANGE_EVENT, () =>
    generations.set(document, (generations.get(document) ?? 0) + 1),
  );
  return 0;
}

/**
 * The context a theme is read in, as text: two elements with the same key
 * read the same theme. It holds what `observeChartTheme` watches — each
 * ancestor's `data-*`, `class`, `dir` and the declarations of its inline style
 * other than geometry and private wiring, the three media features, the
 * theme stylesheets applied at runtime, whether the fonts are loaded — and
 * the number of stylesheets, so a stylesheet a route loads later is a new
 * context. Reading it computes no
 * style and forces no layout.
 */
export function chartThemeKey(element: Element): string {
  const document = element.ownerDocument;
  const view = document.defaultView;
  const adopted = (document as Document & { adoptedStyleSheets?: readonly unknown[] })
    .adoptedStyleSheets;
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  const parts = [
    `${generationOf(document)} ${document.styleSheets.length} ${adopted?.length ?? 0} ${fonts?.status ?? ''}`,
    THEME_QUERIES.map((query) => (view?.matchMedia?.(query).matches ? 1 : 0)).join(''),
  ];
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    let own = node.tagName;
    for (const { name, value } of Array.from(node.attributes)) {
      if (name === 'style') {
        for (const [property, declared] of themedDeclarations(document, value)) {
          own += ` ${property}:${declared}`;
        }
      } else if (name === 'class' || name === 'dir' || name.startsWith('data-')) {
        own += ` ${name}=${value}`;
      }
    }
    parts.push(own);
  }
  return parts.join('\n');
}

/** The theme a chart already read in this element's context, or null. */
export function cachedChartTheme(element: Element): ChartTheme | null {
  return storeOf(element.ownerDocument).get(chartThemeKey(element)) ?? null;
}

/** Inline declarations that place or size a box and inherit nothing a theme reads. */
const GEOMETRY =
  /^(?:translate|transform|transform-origin|rotate|scale|inset(?:-.+)?|top|right|bottom|left|(?:min-|max-)?(?:width|height|inline-size|block-size)|grid-(?:area|row|column)(?:-start|-end)?|order|z-index|will-change)$/;

export function sameTheme(a: ChartTheme | null, b: ChartTheme | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const scratches = new WeakMap<Document, HTMLElement>();

/** An inline style's declarations that can reach a color: not geometry, not private wiring. */
function themedDeclarations(document: Document, text: string | null) {
  let scratch = scratches.get(document);
  if (scratch === undefined) {
    scratch = document.createElement('div');
    scratches.set(document, scratch);
  }
  scratch.setAttribute('style', text ?? '');
  const declarations = new Map<string, string>();
  for (const name of Array.from(scratch.style)) {
    if (!GEOMETRY.test(name) && !name.startsWith('--_')) {
      declarations.set(name, scratch.style.getPropertyValue(name));
    }
  }
  return declarations;
}

/**
 * Calls back when anything that can change the theme at an element changes:
 * the scheme, theme or density attribute anywhere in the document, a class or
 * an inline style (a token overridden on a wrapper), and the three media
 * features the foundation answers. The caller re-reads and compares; this
 * only says when to look.
 *
 * One observer per chart, on the document, filtered to attributes and then
 * to the chart's own ancestors: a token inherits down the tree and nowhere
 * else, and the engine, the tooltip and the probe rewrite `style` inside the
 * chart on every pointer move, which would otherwise re-read the theme sixty
 * times a second. An ancestor's inline style counts only when it changes a
 * declaration other than its geometry and a family's private wiring (`--_*`):
 * a widget carried across a dashboard writes its `translate` every frame and
 * its cell on every preview, and none of it reaches a color.
 */
export function observeChartTheme(element: Element, onChange: () => void): () => void {
  const document = element.ownerDocument;
  const view = document.defaultView;
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame =
      view?.requestAnimationFrame(() => {
        frame = 0;
        onChange();
      }) ?? 0;
  };
  const restyled = (record: MutationRecord) => {
    const before = themedDeclarations(document, record.oldValue);
    const after = themedDeclarations(document, (record.target as Element).getAttribute('style'));
    if (before.size !== after.size) return true;
    for (const [name, value] of after) if (before.get(name) !== value) return true;
    return false;
  };
  const observer = new MutationObserver((records) => {
    const relevant = (record: MutationRecord) =>
      record.target.contains(element) && (record.attributeName !== 'style' || restyled(record));
    if (records.some(relevant)) schedule();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeOldValue: true,
    subtree: true,
    attributeFilter: [
      'data-slotted-scheme',
      'data-slotted-theme',
      'data-slotted-density',
      'class',
      'style',
      'dir',
    ],
  });
  const queries = THEME_QUERIES.map((query) => view?.matchMedia?.(query)).filter(
    (query): query is MediaQueryList => Boolean(query),
  );
  for (const query of queries) query.addEventListener('change', schedule);
  /* A theme applied at runtime changes no attribute: its stylesheet announces itself. */
  document.addEventListener(THEME_CHANGE_EVENT, schedule);
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  let live = true;
  /* Fonts already loaded change nothing: re-reading then cost every chart a
     read after mount, cached or not. */
  if (fonts && fonts.status !== 'loaded') fonts.ready.then(() => live && schedule());

  return () => {
    live = false;
    observer.disconnect();
    for (const query of queries) query.removeEventListener('change', schedule);
    document.removeEventListener(THEME_CHANGE_EVENT, schedule);
    if (frame) view?.cancelAnimationFrame(frame);
  };
}
