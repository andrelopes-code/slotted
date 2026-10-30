import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SlField, SlFieldDescription, SlFieldLabel } from '@slotted/angular/field';
import { provideSlotted } from '@slotted/angular/i18n';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlColorField } from './color-field';
import { SlColorPicker } from './color-picker';
import { provideColorPickerDefaults } from './color-picker-defaults';
import type { ColorFormat } from './color-picker-defaults';
import { ANGULAR_COLOR_PICKER_DOCS, ANGULAR_COLOR_PICKER_TOKENS } from './color-picker.docs';

const BRAND = [
  '#0F172A',
  '#64748B',
  '#DC2626',
  '#EA580C',
  '#D97706',
  '#16A34A',
  '#0D9488',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
];

const DIRECTIVES = [
  ReactiveFormsModule,
  SlColorField,
  SlColorPicker,
  SlField,
  SlFieldDescription,
  SlFieldLabel,
];

/** A panel and the value it reports, so a reader sees what the consumer receives. */
@Component({
  selector: 'sl-color-picker-live-demo',
  standalone: true,
  imports: DIRECTIVES,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="slotted-demo-stack">
      <div
        slColorPicker
        [value]="value()"
        [format]="format()"
        [presets]="presets"
        [contrastWith]="contrastWith()"
        (valueChange)="value.set($event.value)"
        (formatChange)="format.set($event.value)"
      ></div>
      <p slFieldDescription>
        {{ format() }}: <code>{{ value() }}</code>
      </p>
    </div>
  `,
})
class LiveDemo {
  readonly initial = input('#2563EB');
  readonly contrastWith = input<string | undefined>(undefined);
  readonly presets = BRAND;
  readonly value = signal('#2563EB');
  readonly format = signal<ColorFormat>('hex');

  ngOnInit() {
    this.value.set(this.initial());
  }
}

const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'block' | 'row' | 'stack' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_COLOR_PICKER_DOCS.colorPicker.scenes, {
    playground: Playground,
    field: FieldStory,
    panel: Panel,
    formats: Formats,
    alpha: Alpha,
    presets: Presets,
    contrast: Contrast,
    states: States,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta = {
  title: 'Components/ColorPicker',
  component: SlColorPicker,
  decorators: [moduleMetadata({ imports: [...DIRECTIVES, LiveDemo] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Color Picker',
        description:
          'Choosing a color: an area for saturation and brightness, the hue and the opacity, the value as text in the notation the reader chose, a palette, and the contrast against the background the color will sit on — inline, or in a field whose swatch opens it.',
        framework: 'Angular',
        ...ANGULAR_COLOR_PICKER_DOCS.colorPicker,
        tokens: ANGULAR_COLOR_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => ({
    template: `<div class="slotted-demo-stage" data-layout="stack"><sl-color-picker-live-demo contrastWith="#FFFFFF" /></div>`,
  }),
};

export const FieldStory: Story = {
  name: 'Field',
  parameters: scenario('field'),
  render: () => ({
    props: { brand: BRAND },
    template: grid(
      2,
      scene(
        'Brand color in a settings form',
        'Press the swatch: the panel opens under the field. Type rgb(220 38 38) and press Enter: the field keeps hex, the notation it shows.',
        `<div slField>
           <label slFieldLabel>Primary color</label>
           <div slColorField defaultValue="#2563EB" [presets]="brand"></div>
           <p slFieldDescription>Used on buttons and links.</p>
         </div>`,
        'block',
      ) +
        scene(
          'A label color, as hsl',
          'The field keeps the notation it was given; the panel inside writes hsl too.',
          `<div slField>
             <label slFieldLabel>Cor da etiqueta</label>
             <div slColorField [alpha]="false" defaultValue="hsl(142 76% 36%)" size="sm"></div>
           </div>`,
          'block',
        ),
    ),
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => ({
    props: { brand: BRAND, none: [] },
    template: grid(
      2,
      scene(
        'The whole anatomy',
        'Area, hue, opacity, the preview of now beside before, the text with its notation, the eyedropper where the browser has one, and the palette.',
        `<div slColorPicker defaultValue="#7C3AED" [presets]="brand"></div>`,
      ) +
        scene(
          'A smaller panel, chosen by inputs',
          'alpha off and no presets leave the area, the hue and the row.',
          `<div slColorPicker [alpha]="false" [presets]="none" defaultValue="#16A34A"></div>`,
        ),
    ),
  }),
};

export const Formats: Story = {
  parameters: scenario('formats'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Change the notation, keep the color',
        'Open the HEX menu and choose another notation: the value below is rewritten in it, and every later change arrives in it.',
        `<sl-color-picker-live-demo initial="#2563EB" />`,
      ),
    ),
  }),
};

export const Alpha: Story = {
  parameters: scenario('alpha'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A translucent overlay color',
        'The opacity channel fades the color over the transparency grid, and the value carries the alpha.',
        `<div slColorPicker defaultValue="rgb(22 163 74 / 60%)"></div>`,
      ) +
        scene(
          'A brand color that must be opaque',
          '[alpha]="false" takes the channel away; the value never carries an alpha.',
          `<div slColorPicker [alpha]="false" defaultValue="#16A34A"></div>`,
        ),
    ),
  }),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  decorators: [moduleMetadata({ providers: [provideColorPickerDefaults({ presets: BRAND })] })],
  render: () => ({
    template: grid(
      1,
      scene(
        'The brand palette, set once',
        'Tab to the palette and use the arrow keys: each step chooses, the radio group’s way.',
        `<div slColorPicker defaultValue="#DC2626"></div>`,
      ),
    ),
  }),
};

export const Contrast: Story = {
  parameters: scenario('contrast'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Text on white',
        'Move the brightness down and watch the level cross from Fail to AA large, AA and AAA.',
        `<sl-color-picker-live-demo initial="#94A3B8" contrastWith="#FFFFFF" />`,
      ) +
        scene(
          'Text on a dark header',
          'The same panel against #0F172A: a light color passes, the brand blue does not.',
          `<sl-color-picker-live-demo initial="#F8FAFC" contrastWith="#0F172A" />`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Disabled',
        'Out of the tab order; the color greyed so nothing reads as choosable.',
        `<div slColorPicker disabled defaultValue="#64748B"></div>`,
      ) +
        scene(
          'Read-only',
          'The sliders take focus and say their values; nothing moves.',
          `<div slColorPicker readOnly defaultValue="#DB2777"></div>`,
        ) +
        scene(
          'Outside sRGB',
          'An oklch color no screen in sRGB can show is said, and kept as written.',
          `<div slColorPicker defaultValue="oklch(0.9 0.3 150)"></div>`,
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    moduleMetadata({
      providers: [
        provideSlotted({ locale: 'pt-BR' }),
        provideColorPickerDefaults({ format: 'hsl' }),
      ],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'Portuguese words and hsl, for the whole application',
        'provideSlotted sets the language and provideColorPickerDefaults the notation, once; the picker below states nothing of its own.',
        `<div slColorPicker defaultValue="hsl(221 83% 53%)"></div>`,
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Every slider and the palette from the keyboard',
        'Tab to the area and use the arrows: right adds saturation, up adds brightness; Shift moves ten at a time. On the hue, Home and End go to the ends.',
        `<sl-color-picker-live-demo initial="#0D9488" />`,
      ),
    ),
  }),
};
