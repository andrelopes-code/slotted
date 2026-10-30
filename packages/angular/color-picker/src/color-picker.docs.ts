import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import colorPickerTokens from '@slotted/styles/color-picker/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_COLOR_PICKER_TOKENS = colorPickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Color Picker decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideColorPickerDefaults,\n  SlColorField,\n  SlColorPicker,\n} from '@slotted/angular/color-picker';",
  selector: 'div[slColorPicker], div[slColorField]',
  exportAs: 'slColorPicker, slColorField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[slColorPicker]',
    required: true,
    purpose:
      'The panel. Carries data-ui="color-picker", data-size, data-format, data-disabled, data-readonly, data-invalid and data-out-of-gamut, and every color it paints as a runtime property: --slotted-color-picker-color, -opaque, -hue, -x, -y, -alpha, -previous, -contrast-with.',
  },
  {
    part: 'area',
    element: 'div, drawn by the panel',
    required: false,
    purpose:
      'Saturation along the reading direction, brightness upward, over the pure hue. A press moves the thumb there and the pointer is captured until it lets go.',
  },
  {
    part: 'area-thumb',
    element: 'div role="slider"',
    required: false,
    purpose:
      'The one focusable point of the area: arrows move saturation and brightness by 1 %, Shift or PageUp/PageDown by 10 %. Its value text says both in words.',
  },
  {
    part: 'channel',
    element: 'div, drawn by the panel',
    required: false,
    purpose:
      'The hue around the circle, drawn by one gradient interpolated the long way; or the alpha from nothing to whole over the transparency grid.',
  },
  {
    part: 'channel-thumb',
    element: 'div role="slider"',
    required: false,
    purpose:
      'The APG slider: arrows ±1, Shift and PageUp/PageDown ±10, Home and End to the ends. It travels inside its track, so at either end it still sits on the color it names.',
  },
  {
    part: 'row',
    element: 'div, drawn by the panel',
    required: false,
    purpose: 'The preview, the value as text, its notation and the eyedropper, on one line.',
  },
  {
    part: 'swatch',
    element: 'span role="img"',
    required: false,
    purpose: 'The color now, over the transparency grid, named by its value.',
  },
  {
    part: 'previous',
    element: 'button',
    required: false,
    purpose:
      'The color the panel opened with, beside the color now; pressing it restores that color with the reason "select".',
  },
  {
    part: 'input',
    element: 'input, in a text-field frame',
    required: false,
    purpose:
      'The value as text in any notation. A color still being written is aria-invalid and left alone; Enter or leaving commits it in the current notation, or puts back the last valid one. Always left-to-right.',
  },
  {
    part: 'format',
    element: 'button with slMenuTriggerFor',
    required: false,
    purpose:
      'The notation — hex, rgb, hsl, oklch — as a menu of radio items; a change rewrites the value.',
  },
  {
    part: 'eyedropper',
    element: 'button',
    required: false,
    purpose:
      'The platform’s EyeDropper, drawn only where window.EyeDropper exists; the color picked arrives with the reason "programmatic".',
  },
  {
    part: 'presets',
    element: 'div role="radiogroup"',
    required: false,
    purpose: 'Colors offered as one press; arrow keys move and choose, the radio group’s own way.',
  },
  {
    part: 'preset',
    element: 'button role="radio"',
    required: false,
    purpose:
      'One preset, named by its value; the chosen one is ringed at a gap of the panel’s ground.',
  },
  {
    part: 'contrast',
    element: 'div aria-live="polite"',
    required: false,
    purpose:
      'Drawn when contrastWith is given: Aa in the color over that background, the WCAG ratio, and the level in words — AAA, AA, AA large or Fail.',
  },
  { part: 'contrast-sample', element: 'span', required: false, purpose: 'The Aa sample.' },
  { part: 'contrast-ratio', element: 'span', required: false, purpose: 'The ratio, 5.17:1.' },
  {
    part: 'contrast-level',
    element: 'span',
    required: false,
    purpose: 'The level, a word in a toned badge.',
  },
  {
    part: 'gamut',
    element: 'p role="status"',
    required: false,
    purpose:
      'Drawn when an oklch value lies outside sRGB: the value is kept as written and the panel says the screen shows the nearest color.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The whole panel. Drag in the area, move the hue and the opacity, type a color in any notation, change the notation, pick a preset; the value under the panel is what onValueChange receives.',
    snippet: defineSnippet({
      id: 'color-picker-angular-playground',
      language: 'angular',
      label: 'A panel and its value',
      source: `<div slColorPicker defaultValue="#2563EB" (valueChange)="color.set($event.value)"></div>`,
    }),
  },
  {
    id: 'field',
    title: 'A field that holds a color',
    note: 'The swatch in the field’s start opens the panel in a popover; the text takes any notation and keeps the one shown. In a Field, the label names the text.',
    snippet: defineSnippet({
      id: 'color-picker-angular-field',
      language: 'angular',
      label: 'ColorField in a Field',
      source: `<div slField>
  <label slFieldLabel>Primary color</label>
  <div slColorField [formControl]="primary" [presets]="brand"></div>
</div>`,
    }),
  },
  {
    id: 'panel',
    title: 'Choosing the parts',
    note: 'The parts are chosen by inputs: alpha off and no presets leave the area, the hue and the row, for a settings row with no room for more.',
    snippet: defineSnippet({
      id: 'color-picker-angular-panel',
      language: 'angular',
      label: 'A panel without alpha or presets',
      source: `<div slColorPicker [alpha]="false" [presets]="[]" defaultValue="#16A34A"></div>`,
    }),
  },
  {
    id: 'formats',
    title: 'Four notations, one color',
    note: 'The value comes back in the notation shown. Change it in the menu and the value is rewritten; type another notation and it is converted to this one.',
    snippet: defineSnippet({
      id: 'color-picker-angular-formats',
      language: 'angular',
      label: 'format and onFormatChange',
      source: `<div
  slColorPicker
  defaultValue="#2563EB"
  [format]="format()"
  (formatChange)="format.set($event.value)"
></div>`,
    }),
  },
  {
    id: 'alpha',
    title: 'Opacity',
    note: 'The alpha channel fades the color over the transparency grid, drawn from the theme’s own surfaces. alpha={false} removes it for a color that must be opaque — a brand color, a text color.',
    snippet: defineSnippet({
      id: 'color-picker-angular-alpha',
      language: 'angular',
      label: 'With and without alpha',
      source: `<div slColorPicker defaultValue="rgb(22 163 74 / 60%)"></div>
<div slColorPicker defaultValue="#16A34A" [alpha]="false"></div>`,
    }),
  },
  {
    id: 'presets',
    title: 'A palette as one press',
    note: 'The presets are a radio group: arrow keys move and choose. The chosen one is ringed; a value that matches none leaves the first focusable.',
    snippet: defineSnippet({
      id: 'color-picker-angular-presets',
      language: 'ts',
      label: 'presets, once for the application',
      source: `providers: [provideColorPickerDefaults({ presets: ['#0F172A', '#DC2626', '#16A34A', '#2563EB'] })];`,
    }),
  },
  {
    id: 'contrast',
    title: 'Contrast against the background it will sit on',
    note: 'contrastWith names the background; the panel shows Aa in the color over it, the WCAG ratio and the level in words. An alpha color is composited first, because that is what the reader sees.',
    snippet: defineSnippet({
      id: 'color-picker-angular-contrast',
      language: 'angular',
      label: 'contrastWith',
      source: `<div slColorPicker defaultValue="#64748B" contrastWith="#FFFFFF"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Disabled, read-only and out of gamut',
    note: 'Disabled greys the color and takes the panel out of the tab order; read-only keeps the sliders focusable and moves nothing; an oklch color outside sRGB is said, never quietly clipped.',
    snippet: defineSnippet({
      id: 'color-picker-angular-states',
      language: 'angular',
      label: 'Unstated rather than false, so the panel defers to its field',
      source: `<div slColorPicker disabled defaultValue="#64748B"></div>
<div slColorPicker readOnly defaultValue="#DB2777"></div>
<div slColorPicker defaultValue="oklch(0.9 0.3 150)"></div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once',
    note: 'The provider carries the notation and the palette; the words come from the language in force.',
    snippet: defineSnippet({
      id: 'color-picker-angular-composition',
      language: 'angular',
      label: 'A provider',
      source: `<div slColorPicker #picker="slColorPicker" [formControl]="color"></div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Tab reaches the area, each channel, the restore, the text, the notation, the eyedropper and the chosen preset. Arrows move by 1, Shift and PageUp/PageDown by 10, Home and End to the ends of a channel; in a right-to-left document the horizontal arrows follow the mirrored axis.',
    snippet: defineSnippet({
      id: 'color-picker-angular-keyboard',
      language: 'angular',
      label: 'No key is bound beyond the sliders and the radio group',
      source: `<div slColorPicker defaultValue="#2563EB"></div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string>',
    when: 'Before the color moves, in the current notation: reason "pointer", "keyboard", "select" (a preset, the restore, a notation change) or "programmatic" (the eyedropper). cancel() refuses the move.',
  },
  {
    name: '(formatChange)',
    payload: 'ChangeRequest<ColorFormat>',
    when: 'Before the notation changes, with reason "select".',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the form’s own value',
    when: 'On both slColorPicker and slColorField, whenever the color moves and nobody refused it.',
  },
];

export const ANGULAR_COLOR_PICKER_DOCS = {
  colorPicker: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'variant',
        "'outline' | 'subtle'",
        'outline',
        'slColorField',
        'The text-field frame of the field',
      ],
      [
        'required',
        'boolean',
        'from the field',
        'slColorField',
        'aria-required on the text, never the native attribute',
      ],
      [
        'value',
        'string',
        '—',
        'slColorPicker, slColorField',
        'Present means controlled: a color in hex, rgb, hsl or oklch',
      ],
      [
        'defaultValue',
        'string',
        '#000000',
        'slColorPicker, slColorField',
        'What an uncontrolled picker starts from',
      ],
      [
        'format',
        "'hex' | 'rgb' | 'hsl' | 'oklch'",
        'hex',
        'slColorPicker, slColorField, provideColorPickerDefaults',
        'The notation the value is written in; defaults to the value’s own, then to the provider’s. defaultFormat is the uncontrolled half',
      ],
      [
        'alpha',
        'boolean',
        'true',
        'slColorPicker, slColorField',
        'Whether the color carries an alpha channel',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slColorPicker, slColorField, provideColorPickerDefaults',
        'The step, read from the field first',
      ],
      [
        'presets',
        'readonly string[]',
        '—',
        'slColorPicker, slColorField, provideColorPickerDefaults',
        'Colors offered as one press',
      ],
      [
        'contrastWith',
        'string',
        '—',
        'slColorPicker, slColorField',
        'The background the contrast is measured against; absent, no contrast is drawn',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slColorPicker, slColorField',
        'Out of the tab order; the color greyed',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slColorPicker, slColorField',
        'Focusable and legible; nothing moves',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slColorPicker, slColorField',
        'data-invalid on the root; aria-invalid on the text',
      ],
      [
        'open',
        'boolean',
        'false',
        'slColorField',
        'Present means the consumer owns whether the panel is open; defaultOpen is the uncontrolled half',
      ],
      [
        'messages',
        'Partial<ColorPickerMessages>',
        '—',
        'slColorPicker, slColorField',
        'Words laid over the language in force, key by key: what each control is called, the gamut sentence and the contrast levels',
      ],
    ]),
    composition: apiRows([
      [
        'div[slColorField]',
        'component',
        '—',
        'a form',
        'A text-field whose start is the swatch (data-part="trigger"), opening the panel in a popover; its aria-label moves onto the text. [(open)] is a model',
      ],
      [
        'provideColorPickerDefaults',
        '(defaults: Partial<ColorPickerDefaults>) => Provider',
        '—',
        'an injector',
        'The notation, the palette and the size an application takes once',
      ],
      [
        'exportAs',
        'slColorPicker, slColorField',
        '—',
        'templates',
        'Reach the instance; current() is the value in its notation',
      ],
    ]),
    accessibility: [
      'Each thumb is a slider with a name and a value text in words — "Hue, 221°", "Opacity, 60 %", "Saturation and brightness, 84 %, 92 %" — so the color is never told by color alone; the area thumb carries aria-roledescription "2D slider", the React Aria convention for a slider with two axes.',
      'The keyboard is the APG slider for each channel and the APG radio group for the presets; in a right-to-left document the horizontal arrows follow the mirrored axis.',
      'The contrast part names the level in words beside the ratio, and it is aria-live polite, so a reader adjusting the color hears when it crosses AA.',
      'The text is always left-to-right: a color notation reads the same in every language.',
      'Forced colors keep the reader’s colors visible: the area, the channels, the swatches and the presets opt out of the system palette, because a color picker whose colors are replaced shows nothing.',
    ],
    snippets: [
      defineSnippet({
        id: 'color-picker-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div slColorPicker defaultValue="#2563EB" contrastWith="#FFFFFF"></div>`,
      }),
      defineSnippet({
        id: 'color-picker-theming',
        language: 'css',
        label: 'Retuning the family',
        source: `[data-ui='color-picker'] {
  --slotted-color-picker-width: 18rem;
  --slotted-color-picker-thumb-size: 1.25rem;
  --slotted-color-picker-channel-size: 0.875rem;
}`,
      }),
    ],
  },
} as const;
