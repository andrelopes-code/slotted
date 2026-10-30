import type { ThemeOverrides } from '@slotted/theme';

import type { ButtonChoice, FocusChoice, InputChoice, TabChoice } from './customisation';

/**
 * The styles a control can be drawn in, as theme overrides: the vocabulary
 * the catalogue themes are written in and the one the builder's Controls
 * axes write over them. Each style is the tokens it moves and, where no
 * token reaches, theme rules that select only the families' public hooks.
 *
 * A theme's rules and the builder's share one layer (`slotted.theme-rules`),
 * the builder's last. So the rules of a style restate every property any
 * other style of the same axis writes, in every state that style touches:
 * the later set wins wherever the two would otherwise mix. Focus and the
 * invalid edge are drawn only where colours are not forced; under forced
 * colours each family's own outline, in a system colour, marks both.
 */

type Components = NonNullable<ThemeOverrides['components']>;
type Base = NonNullable<ThemeOverrides['base']>;

export interface ControlStyle {
  readonly base?: Base;
  readonly components?: Components;
  readonly rules: readonly string[];
}

/** The style each Controls axis has in a theme: what the axis's "Theme" choice keeps. */
export interface ControlChoices {
  readonly input: InputChoice;
  readonly focus: FocusChoice;
  readonly button: ButtonChoice;
}

const NOT_FORCED = (body: string) => `@media not (forced-colors: active) {\n${body}\n}`;

/**
 * The families whose root draws the frame around a value, with the condition
 * under which the root holds keyboard focus. `textarea` is its own control;
 * `date-field` focuses a segment by script, so any focus inside counts.
 */
export const FIELD_FAMILIES = [
  { ui: 'text-field', focus: ":has(> [data-part='input']:focus-visible)" },
  { ui: 'number-field', focus: ":has(> [data-part='input']:focus-visible)" },
  { ui: 'currency-field', focus: ":has(> [data-part='input']:focus-visible)" },
  { ui: 'combobox', focus: ":has(> [data-part='input']:focus-visible)" },
  { ui: 'select', focus: ":has(> [data-part='trigger']:focus-visible)" },
  { ui: 'multi-select', focus: ":has([data-part='input']:focus-visible)" },
  { ui: 'tags-input', focus: ":has([data-part='input']:focus-visible)" },
  { ui: 'textarea', focus: ':focus-visible' },
  { ui: 'date-field', focus: ':focus-within' },
] as const;

const fieldRoot = (ui: string) => `[data-ui='${ui}'][data-part='root']:not([data-variant='plain'])`;
const fieldToken = (ui: string, name: string) => `--slotted-${ui}-${name}`;

/**
 * A field's corner and its invalid edge's width and colour, as its family's
 * tokens name them, with the family's own fallbacks: an undeclared `var()`
 * with none would discard the whole declaration.
 */
const fieldRadius = (ui: string) =>
  `var(${fieldToken(ui, 'radius')}, var(--slotted-control-radius))`;
const edgeWidth = (ui: string) =>
  `var(${fieldToken(ui, 'invalid-edge-width')}, var(--slotted-control-invalid-edge-width))`;
const edgeColor = (ui: string) =>
  `var(${fieldToken(ui, 'invalid-border-color')}, var(--slotted-tone-danger-border))`;

/** The field's tokens per input style: its ground, its line at rest and under the pointer, its shadow. */
const INPUT_TOKENS: Readonly<
  Record<InputChoice, Readonly<Record<'background' | 'line' | 'hover' | 'shadow', string>>>
> = {
  outlined: {
    background: 'var(--slotted-control-surface)',
    line: 'var(--slotted-control-border-color)',
    hover: 'var(--slotted-tone-accent-border)',
    shadow: 'var(--slotted-control-shadow)',
  },
  /* A tonal fill and an indicator line in the muted ink, at 3:1 on the fill (Material's filled field). */
  filled: {
    background: 'var(--slotted-tone-secondary-surface)',
    line: 'var(--slotted-text-muted)',
    hover: 'var(--slotted-text)',
    shadow: 'none',
  },
  /* The line alone, in the strong border at 3:1 on the page. */
  underline: {
    background: 'transparent',
    line: 'var(--slotted-border-strong)',
    hover: 'var(--slotted-text)',
    shadow: 'none',
  },
  /*
   * A soft fill with no line, which a line answers under the pointer. The fill
   * is the secondary tone's, not a page ground: on a sunken form a sunken
   * fill left the field invisible.
   */
  borderless: {
    background: 'var(--slotted-tone-secondary-surface)',
    line: 'transparent',
    hover: 'var(--slotted-control-border-color)',
    shadow: 'none',
  },
};

/** The edges an input style draws: every side, or the bottom alone. */
const BOTTOM_ONLY: ReadonlySet<InputChoice> = new Set(['filled', 'underline']);

export function inputTokens(input: InputChoice): Components {
  const values = INPUT_TOKENS[input];
  return Object.fromEntries(
    FIELD_FAMILIES.flatMap(({ ui }) => [
      [fieldToken(ui, 'background'), values.background],
      [fieldToken(ui, 'border-color'), values.line],
      [fieldToken(ui, 'hover-border-color'), values.hover],
      [fieldToken(ui, 'shadow'), values.shadow],
    ]),
  ) as Components;
}

/** The invalid edge: on four sides, or on the bottom alone where the frame is a bottom line. */
const invalidEdge = (ui: string, input: InputChoice) =>
  BOTTOM_ONLY.has(input)
    ? `inset 0 calc(-1 * ${edgeWidth(ui)}) 0 ${edgeColor(ui)}`
    : `inset 0 0 0 ${edgeWidth(ui)} ${edgeColor(ui)}`;

/** The frame at rest: which edges carry the line, and which corners round. */
function frame(ui: string, input: InputChoice): string {
  const width = BOTTOM_ONLY.has(input)
    ? '0 0 var(--slotted-control-border-width)'
    : 'var(--slotted-control-border-width)';
  const radius =
    input === 'underline'
      ? 'var(--slotted-radius-none)'
      : input === 'filled'
        ? `${fieldRadius(ui)} ${fieldRadius(ui)} var(--slotted-radius-none) var(--slotted-radius-none)`
        : fieldRadius(ui);
  const rest = `${fieldRoot(ui)} {
  border-style: solid;
  border-width: ${width};
  border-radius: ${radius};
}`;
  if (input !== 'borderless') return rest;
  /*
   * High-contrast paints the secondary surface in the page's white, so a
   * borderless field there takes the control's line. Every element that
   * carries a scheme is a scope root, so `&` also covers a nested scheme. An
   * invalid one keeps the family's edge.
   */
  const field = `${fieldRoot(ui)}:not([data-invalid])`;
  return `${rest}

&[data-slotted-scheme='high-contrast'] ${field} {
  border-color: var(--slotted-control-border-color);
}`;
}

const RING = 'var(--slotted-focus-ring-color)';
const HALO = `color-mix(in oklab, ${RING} 28%, transparent)`;

/**
 * A field under keyboard focus, and invalid under keyboard focus. Every style
 * writes the same four properties, so the later style's values hold in full.
 */
function fieldFocus(ui: string, focus: string, input: InputChoice, style: FocusChoice): string {
  const root = `${fieldRoot(ui)}${focus}`;
  const invalid = `${fieldRoot(ui)}[data-invalid]${focus}`;
  const line = `var(${fieldToken(ui, 'border-color')}, var(--slotted-control-border-color))`;
  const edge = invalidEdge(ui, input);
  const ring = 'var(--slotted-control-shadow-focus-geometry) ' + RING;
  const states: Record<FocusChoice, { readonly at: string[]; readonly invalid: string }> = {
    ring: {
      at: [
        `border-color: ${line};`,
        `box-shadow: ${ring};`,
        `outline: var(--slotted-focus-ring-width) solid ${RING};`,
        'outline-offset: var(--slotted-focus-ring-offset);',
      ],
      invalid: `box-shadow: ${edge}, ${ring};`,
    },
    offset: {
      at: [
        `border-color: ${line};`,
        'box-shadow: none;',
        `outline: var(--slotted-focus-ring-width) solid ${RING};`,
        'outline-offset: var(--slotted-focus-ring-offset);',
      ],
      invalid: `box-shadow: ${edge};`,
    },
    /* The line takes the ring's colour, a 1px ring doubles it, and a halo spreads 3px past it. */
    glow: {
      at: [
        `border-color: ${RING};`,
        `box-shadow: 0 0 0 1px ${RING}, 0 0 0 4px ${HALO};`,
        'outline: var(--slotted-focus-ring-width) solid transparent;',
        'outline-offset: 0px;',
      ],
      invalid: `box-shadow: ${edge}, 0 0 0 1px ${RING}, 0 0 0 4px ${HALO};`,
    },
    /* The bottom line thickens by the thick line, in the ring's colour; invalid, by the edge as well. */
    underline: {
      at: [
        `border-color: ${line};`,
        `border-block-end-color: ${RING};`,
        `box-shadow: inset 0 calc(-1 * var(--slotted-border-width-thick)) 0 ${RING};`,
        'outline: var(--slotted-focus-ring-width) solid transparent;',
        'outline-offset: 0px;',
      ],
      invalid: `box-shadow: inset 0 calc(-1 * (var(--slotted-border-width-thick) + ${edgeWidth(ui)})) 0 ${RING};`,
    },
  };
  const state = states[style];
  return `${fieldRoot(ui)}[data-invalid]:not([data-disabled]) {
  box-shadow: ${edge};
}

${root} {
  ${state.at.join('\n  ')}
}

${invalid} {
  ${state.invalid}
}`;
}

/** The fields in one input style and one focus style, for every field family. */
export function fieldRules(input: InputChoice, focus: FocusChoice): string[] {
  return [
    FIELD_FAMILIES.map(({ ui }) => frame(ui, input)).join('\n\n'),
    NOT_FORCED(
      FIELD_FAMILIES.map(({ ui, focus: focused }) => fieldFocus(ui, focused, input, focus)).join(
        '\n\n',
      ),
    ),
  ];
}

/**
 * The focus tokens every control reads: the ring's width and its distance
 * from the edge, both on the line scale — the thick line, and twice it for
 * the offset outline.
 */
export const FOCUS_TOKENS: Readonly<Record<FocusChoice, Base>> = {
  ring: {
    '--slotted-focus-ring-width': 'var(--slotted-border-width-thick)',
    '--slotted-focus-ring-offset': 'var(--slotted-border-width-thick)',
  },
  offset: {
    '--slotted-focus-ring-width': 'var(--slotted-border-width-thick)',
    '--slotted-focus-ring-offset': 'calc(2 * var(--slotted-border-width-thick))',
  },
  glow: {
    '--slotted-focus-ring-width': 'var(--slotted-border-width-thick)',
    '--slotted-focus-ring-offset': 'var(--slotted-border-width-thick)',
  },
  underline: {
    '--slotted-focus-ring-width': 'var(--slotted-border-width-thick)',
    '--slotted-focus-ring-offset': 'var(--slotted-border-width-thick)',
  },
} as Readonly<Record<FocusChoice, Base>>;

const PRIMARY = "[data-ui='button'][data-variant='solid'][data-tone='accent']";
const ENABLED = ':not(:disabled):not([data-disabled]):not([data-pressed])';

/** What a button's box shadow is at rest, so a focus style that draws none gives it back. */
function buttonRestShadow(button: ButtonChoice): string {
  return [
    `[data-ui='button']:not([data-disabled]):focus-visible:not(:active) {
  box-shadow: var(--slotted-control-shadow);
}`,
    `[data-ui='button'][data-variant='ghost']:not([data-pressed]):not([data-disabled]):focus-visible:not(:active)${
      button === 'soft' || button === 'ghost'
        ? `,\n${PRIMARY}:not([data-pressed]):not([data-disabled]):focus-visible:not(:active)`
        : ''
    } {
  box-shadow: none;
}`,
  ].join('\n\n');
}

/** A button under keyboard focus, in each focus style; ring and offset read the focus tokens. */
function buttonFocus(focus: FocusChoice, button: ButtonChoice): string {
  const at = "[data-ui='button']:not([data-disabled]):focus-visible:not(:active)";
  if (focus === 'ring' || focus === 'offset') {
    return `${at} {
  outline: var(--slotted-focus-ring-width) solid ${RING};
  outline-offset: var(--slotted-focus-ring-offset);
}

${buttonRestShadow(button)}`;
  }
  const shadow =
    focus === 'glow'
      ? `0 0 0 2px var(--slotted-surface), 0 0 0 4px ${RING}, 0 0 0 8px ${HALO}`
      : `0 2px 0 0 var(--slotted-surface), 0 5px 0 0 ${RING}`;
  return `${at} {
  outline: var(--slotted-focus-ring-width) solid transparent;
  outline-offset: var(--slotted-focus-ring-offset);
  box-shadow: ${shadow};
}`;
}

/**
 * The primary button's paint per style, at rest, under the pointer and
 * pressed. The selectors sit in `:where()`, so a focus rule of any style
 * outranks them; a disabled, pressed or loading button keeps the family's.
 */
const BUTTON_PAINT: Readonly<
  Record<
    ButtonChoice,
    Readonly<Record<'ground' | 'edge' | 'ink' | 'shadow' | 'hover' | 'active', string>>
  >
> = {
  solid: {
    ground: 'var(--slotted-tone-accent-solid)',
    edge: 'var(--slotted-tone-accent-solid)',
    ink: 'var(--slotted-tone-accent-on-solid)',
    shadow: 'var(--slotted-control-shadow)',
    hover: 'var(--slotted-tone-accent-solid-hover)',
    active: 'var(--slotted-tone-accent-solid-active)',
  },
  soft: {
    ground: 'var(--slotted-tone-accent-surface)',
    edge: 'var(--slotted-tone-accent-surface)',
    ink: 'var(--slotted-tone-accent-text)',
    shadow: 'none',
    hover: 'var(--slotted-tone-accent-subtle-hover)',
    active: 'var(--slotted-tone-accent-subtle-active)',
  },
  outline: {
    ground: 'transparent',
    edge: 'var(--slotted-tone-accent-border)',
    ink: 'var(--slotted-tone-accent-text)',
    shadow: 'var(--slotted-control-shadow)',
    hover: 'var(--slotted-tone-accent-subtle-hover)',
    active: 'var(--slotted-tone-accent-subtle-active)',
  },
  ghost: {
    ground: 'transparent',
    edge: 'transparent',
    ink: 'var(--slotted-tone-accent-text)',
    shadow: 'none',
    hover: 'var(--slotted-tone-accent-subtle-hover)',
    active: 'var(--slotted-tone-accent-subtle-active)',
  },
};

export function buttonRules(button: ButtonChoice, focus: FocusChoice): string[] {
  const paint = BUTTON_PAINT[button];
  const live = `${PRIMARY}${ENABLED}:not([data-loading])`;
  return [
    NOT_FORCED(`:where(${PRIMARY}${ENABLED}) {
  background-color: ${paint.ground};
  border-color: ${paint.edge};
  box-shadow: ${paint.shadow};
  color: ${paint.ink};
}

:where(${live}):hover {
  background-color: ${paint.hover};
}

:where(${live}):active {
  background-color: ${paint.active};
  box-shadow: none;
}

${buttonFocus(focus, button)}`),
  ];
}

/** Every Controls style a theme or the builder draws: the focus tokens, the field tokens and the rules. */
export function controlStyle(choices: ControlChoices): Required<ControlStyle> {
  return {
    base: FOCUS_TOKENS[choices.focus],
    components: inputTokens(choices.input),
    rules: [
      ...fieldRules(choices.input, choices.focus),
      ...buttonRules(choices.button, choices.focus),
    ],
  };
}

/**
 * The two ways a theme draws the line tabs' selected item: underlined by the
 * family's marker on its track, or a pill on the accent's surface with no
 * marker and no track. Each is the marker's and the track's tokens and the
 * one rule no token reaches, and each rule undoes the other's: the later of
 * the two in `slotted.theme-rules` wins, so the builder's choice holds over a
 * theme's own.
 */
export const TAB_STYLES: Readonly<
  Record<TabChoice, { readonly components: Components; readonly rule: string }>
> = {
  underline: {
    components: {
      '--slotted-tabs-marker-color': 'var(--slotted-tone-accent-solid)',
      '--slotted-tabs-hover-marker-color': 'var(--slotted-border-strong)',
      '--slotted-tabs-track-color': 'var(--slotted-border-subtle)',
    } as Components,
    rule: `[data-ui='tabs'][data-variant='line'] [data-part='item'][data-selected] {
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
}`,
  },
  pill: {
    components: {
      '--slotted-tabs-marker-color': 'transparent',
      '--slotted-tabs-hover-marker-color': 'transparent',
      '--slotted-tabs-track-color': 'transparent',
    } as Components,
    rule: `[data-ui='tabs'][data-variant='line'] [data-part='item'][data-selected] {
  background-color: var(--slotted-tone-accent-surface);
  border-radius: var(--slotted-radius-full);
  box-shadow: none;
}`,
  },
};
