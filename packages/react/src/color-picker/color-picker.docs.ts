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

export const REACT_COLOR_PICKER_TOKENS = colorPickerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Color Picker decision',
}));

const imports: ReferenceImport = {
  source: "import { ColorField, ColorPicker, ColorPickerDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div (ColorPicker)',
    required: true,
    purpose:
      'The panel. Carries data-ui="color-picker", data-size, data-format, data-disabled, data-readonly, data-invalid and data-out-of-gamut, and every color it paints as a runtime property: --slotted-color-picker-color, -opaque, -hue, -x, -y, -alpha, -previous, -contrast-with.',
  },
  {
    part: 'area',
    element: 'div (ColorPickerArea)',
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
    element: 'div (ColorPickerChannel channel="hue" | "alpha")',
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
    element: 'div (ColorPickerRow)',
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
    element: 'input, in a text-field frame (ColorPickerInput)',
    required: false,
    purpose:
      'The value as text in any notation. A color still being written is aria-invalid and left alone; Enter or leaving commits it in the current notation, or puts back the last valid one. Always left-to-right.',
  },
  {
    part: 'format',
    element: 'button, a menu trigger (ColorPickerFormat)',
    required: false,
    purpose:
      'The notation — hex, rgb, hsl, oklch — as a menu of radio items; a change rewrites the value.',
  },
  {
    part: 'eyedropper',
    element: 'button (ColorPickerEyedropper)',
    required: false,
    purpose:
      'The platform’s EyeDropper, drawn only where window.EyeDropper exists; the color picked arrives with the reason "programmatic".',
  },
  {
    part: 'presets',
    element: 'div role="radiogroup" (ColorPickerPresets)',
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
    element: 'div aria-live="polite" (ColorPickerContrast)',
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
    element: 'p role="status" (ColorPickerGamut)',
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
      id: 'color-picker-react-playground',
      language: 'tsx',
      label: 'A panel and its value',
      source: `<ColorPicker defaultValue="#2563EB" onValueChange={(value) => setColor(value)} />;`,
    }),
  },
  {
    id: 'field',
    title: 'A field that holds a color',
    note: 'The swatch in the field’s start opens the panel in a popover; the text takes any notation and keeps the one shown. In a Field, the label names the text.',
    snippet: defineSnippet({
      id: 'color-picker-react-field',
      language: 'tsx',
      label: 'ColorField in a Field',
      source: `<Field>
  <FieldLabel>Primary color</FieldLabel>
  <ColorField defaultValue="#2563EB" presets={brand} />
</Field>;`,
    }),
  },
  {
    id: 'panel',
    title: 'Choosing the parts',
    note: 'With children, the panel draws exactly the parts given: here the area, the hue and the text, for a settings row with no room for more.',
    snippet: defineSnippet({
      id: 'color-picker-react-panel',
      language: 'tsx',
      label: 'A compact panel',
      source: `<ColorPicker alpha={false} defaultValue="#16A34A">
  <ColorPickerArea />
  <ColorPickerChannel channel="hue" />
  <ColorPickerInput />
</ColorPicker>;`,
    }),
  },
  {
    id: 'formats',
    title: 'Four notations, one color',
    note: 'The value comes back in the notation shown. Change it in the menu and the value is rewritten; type another notation and it is converted to this one.',
    snippet: defineSnippet({
      id: 'color-picker-react-formats',
      language: 'tsx',
      label: 'format and onFormatChange',
      source: `<ColorPicker defaultValue="#2563EB" format={format} onFormatChange={setFormat} />;`,
    }),
  },
  {
    id: 'alpha',
    title: 'Opacity',
    note: 'The alpha channel fades the color over the transparency grid, drawn from the theme’s own surfaces. alpha={false} removes it for a color that must be opaque — a brand color, a text color.',
    snippet: defineSnippet({
      id: 'color-picker-react-alpha',
      language: 'tsx',
      label: 'With and without alpha',
      source: `<ColorPicker defaultValue="rgb(22 163 74 / 60%)" />;
<ColorPicker defaultValue="#16A34A" alpha={false} />;`,
    }),
  },
  {
    id: 'presets',
    title: 'A palette as one press',
    note: 'The presets are a radio group: arrow keys move and choose. The chosen one is ringed; a value that matches none leaves the first focusable.',
    snippet: defineSnippet({
      id: 'color-picker-react-presets',
      language: 'tsx',
      label: 'presets, once for the application',
      source: `<ColorPickerDefaultsProvider presets={['#0F172A', '#DC2626', '#16A34A', '#2563EB']}>
  <App />
</ColorPickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'contrast',
    title: 'Contrast against the background it will sit on',
    note: 'contrastWith names the background; the panel shows Aa in the color over it, the WCAG ratio and the level in words. An alpha color is composited first, because that is what the reader sees.',
    snippet: defineSnippet({
      id: 'color-picker-react-contrast',
      language: 'tsx',
      label: 'contrastWith',
      source: `<ColorPicker defaultValue="#64748B" contrastWith="#FFFFFF" />;`,
    }),
  },
  {
    id: 'states',
    title: 'Disabled, read-only and out of gamut',
    note: 'Disabled greys the color and takes the panel out of the tab order; read-only keeps the sliders focusable and moves nothing; an oklch color outside sRGB is said, never quietly clipped.',
    snippet: defineSnippet({
      id: 'color-picker-react-states',
      language: 'tsx',
      label: 'Unstated rather than false, so the panel defers to its field',
      source: `<ColorPicker disabled defaultValue="#64748B" />;
<ColorPicker readOnly defaultValue="#DB2777" />;
<ColorPicker defaultValue="oklch(0.9 0.3 150)" />;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once',
    note: 'The provider carries the notation and the palette; the words come from the language in force.',
    snippet: defineSnippet({
      id: 'color-picker-react-composition',
      language: 'tsx',
      label: 'A provider',
      source: `<ColorPickerDefaultsProvider format="hsl">
  <App />
</ColorPickerDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does',
    note: 'Tab reaches the area, each channel, the restore, the text, the notation, the eyedropper and the chosen preset. Arrows move by 1, Shift and PageUp/PageDown by 10, Home and End to the ends of a channel; in a right-to-left document the horizontal arrows follow the mirrored axis.',
    snippet: defineSnippet({
      id: 'color-picker-react-keyboard',
      language: 'tsx',
      label: 'No key is bound beyond the sliders and the radio group',
      source: `<ColorPicker defaultValue="#2563EB" />;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string, request: ChangeRequest<string>)',
    when: 'Before the color moves, in the current notation: reason "pointer" for a drag, "keyboard" for a key or typed text, "select" for a preset, the restore or a notation change, "programmatic" for the eyedropper.',
  },
  {
    name: 'onFormatChange',
    payload: '(format: ColorFormat, request: ChangeRequest<ColorFormat>)',
    when: 'Before the notation changes, with reason "select".',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request)',
    when: 'On ColorField, before the popover opens or closes.',
  },
];

export const REACT_COLOR_PICKER_DOCS = {
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
        'ColorField',
        'The text-field frame of the field',
      ],
      [
        'required',
        'boolean',
        'from the field',
        'ColorField',
        'aria-required on the text, never the native attribute',
      ],
      [
        'value',
        'string',
        '—',
        'ColorPicker, ColorField',
        'Present means controlled: a color in hex, rgb, hsl or oklch',
      ],
      [
        'defaultValue',
        'string',
        '#000000',
        'ColorPicker, ColorField',
        'What an uncontrolled picker starts from',
      ],
      [
        'format',
        "'hex' | 'rgb' | 'hsl' | 'oklch'",
        'hex',
        'ColorPicker, ColorField, ColorPickerDefaultsProvider',
        'The notation the value is written in; defaults to the value’s own, then to the provider’s. defaultFormat is the uncontrolled half',
      ],
      [
        'alpha',
        'boolean',
        'true',
        'ColorPicker, ColorField',
        'Whether the color carries an alpha channel',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'ColorPicker, ColorField, ColorPickerDefaultsProvider',
        'The step, read from the field first',
      ],
      [
        'presets',
        'readonly string[]',
        '—',
        'ColorPicker, ColorField, ColorPickerDefaultsProvider',
        'Colors offered as one press',
      ],
      [
        'contrastWith',
        'string',
        '—',
        'ColorPicker, ColorField',
        'The background the contrast is measured against; absent, no contrast is drawn',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'ColorPicker, ColorField',
        'Out of the tab order; the color greyed',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'ColorPicker, ColorField',
        'Focusable and legible; nothing moves',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'ColorPicker, ColorField',
        'data-invalid on the root; aria-invalid on the text',
      ],
      [
        'open',
        'boolean',
        'false',
        'ColorField',
        'Present means the consumer owns whether the panel is open; defaultOpen is the uncontrolled half',
      ],
      [
        'messages',
        'Partial<ColorPickerMessages>',
        '—',
        'ColorPicker, ColorField',
        'Words laid over the language in force, key by key: what each control is called, the gamut sentence and the contrast levels',
      ],
    ]),
    composition: apiRows([
      [
        'ColorPickerArea, ColorPickerChannel, ColorPickerRow, ColorPickerSwatch, ColorPickerInput, ColorPickerFormat, ColorPickerEyedropper, ColorPickerPresets, ColorPickerContrast, ColorPickerGamut',
        'components',
        '—',
        'ColorPicker children',
        'The parts, each placeable on its own; without children the panel draws all of them',
      ],
      [
        'ColorField',
        'TextFieldProps & the picker’s props',
        '—',
        'a form',
        'A text-field whose start is the swatch (data-part="trigger", data-ui="color-picker"), opening the panel in a popover; every text-field prop reaches the field',
      ],
      [
        'ColorPickerDefaultsProvider',
        '{ size, format, presets }',
        '—',
        'a subtree',
        'The decisions an application takes once',
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
        id: 'color-picker-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="color-picker" data-part="root" data-format="hex">
  <div data-part="area">
    <div data-part="area-thumb" role="slider" />
  </div>
  <div data-part="channel" data-channel="hue">
    <div data-part="channel-thumb" role="slider" />
  </div>
  <div data-part="row">
    <span data-part="swatch" role="img" />
    <button data-part="previous" />
    <input data-part="input" />
    <button data-part="format" />
  </div>
</div>;`,
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
