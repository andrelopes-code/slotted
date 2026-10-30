import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldDescription, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import {
  ColorField,
  ColorPicker,
  ColorPickerArea,
  ColorPickerChannel,
  ColorPickerInput,
} from './color-picker';
import { ColorPickerDefaultsProvider } from './color-picker-defaults';
import { Grid, Scene } from './color-picker-demo';
import { REACT_COLOR_PICKER_DOCS, REACT_COLOR_PICKER_TOKENS } from './color-picker.docs';
import type { ColorFormat } from './color-picker.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_COLOR_PICKER_DOCS.colorPicker.scenes, {
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

const meta = {
  title: 'Components/ColorPicker',
  component: ColorPicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Color Picker',
        description:
          'Choosing a colour: an area for saturation and brightness, the hue and the opacity, the value as text in the notation the reader chose, a palette, and the contrast against the background the colour will sit on — inline, or in a field whose swatch opens it.',
        framework: 'React',
        ...REACT_COLOR_PICKER_DOCS.colorPicker,
        tokens: REACT_COLOR_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

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

function Live({ initial = '#2563EB', ...props }: { initial?: string; contrastWith?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="slotted-demo-stack">
      <ColorPicker {...props} onValueChange={setValue} presets={BRAND} value={value} />
      <FieldDescription>
        Valor: <code>{value}</code>
      </FieldDescription>
    </div>
  );
}

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="stack">
      <Live contrastWith="#FFFFFF" />
    </div>
  ),
};

export const FieldStory: Story = {
  name: 'Field',
  parameters: scenario('field'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Brand colour in a settings form"
        note="Press the swatch: the panel opens under the field. Type rgb(220 38 38) and press Enter: the field keeps hex, the notation it shows."
      >
        <Field>
          <FieldLabel>Primary color</FieldLabel>
          <ColorField defaultValue="#2563EB" presets={BRAND} />
          <FieldDescription>Used on buttons and links.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="A label colour, as hsl"
        note="The field keeps the notation it was given; the panel inside writes hsl too."
      >
        <Field>
          <FieldLabel>Cor da etiqueta</FieldLabel>
          <ColorField alpha={false} defaultValue="hsl(142 76% 36%)" size="sm" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The whole anatomy"
        note="Area, hue, opacity, the preview of now beside before, the text with its notation, the eyedropper where the browser has one, and the palette."
        layout="stack"
      >
        <ColorPicker defaultValue="#7C3AED" presets={BRAND} />
      </Scene>
      <Scene
        label="Only the parts a row has room for"
        note="With children, the panel draws exactly them: the area, the hue and the text."
        layout="stack"
      >
        <ColorPicker alpha={false} defaultValue="#16A34A">
          <ColorPickerArea />
          <ColorPickerChannel channel="hue" />
          <ColorPickerInput />
        </ColorPicker>
      </Scene>
    </Grid>
  ),
};

function FormatsDemo() {
  const [format, setFormat] = useState<ColorFormat>('oklch');
  const [value, setValue] = useState('oklch(0.546 0.215 262.9)');
  return (
    <div className="slotted-demo-stack">
      <ColorPicker
        format={format}
        onFormatChange={setFormat}
        onValueChange={setValue}
        value={value}
      />
      <FieldDescription>
        {format}: <code>{value}</code>
      </FieldDescription>
    </div>
  );
}

export const Formats: Story = {
  parameters: scenario('formats'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Change the notation, keep the colour"
        note="Open the HEX menu and choose another notation: the value below is rewritten in it, and every later change arrives in it."
        layout="stack"
      >
        <FormatsDemo />
      </Scene>
    </Grid>
  ),
};

export const Alpha: Story = {
  parameters: scenario('alpha'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A translucent overlay colour"
        note="The opacity channel fades the colour over the transparency grid, and the value carries the alpha."
        layout="stack"
      >
        <ColorPicker defaultValue="rgb(22 163 74 / 60%)" />
      </Scene>
      <Scene
        label="A brand colour that must be opaque"
        note="alpha={false} takes the channel away; the value never carries an alpha."
        layout="stack"
      >
        <ColorPicker alpha={false} defaultValue="#16A34A" />
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The brand palette, set once"
        note="Tab to the palette and use the arrow keys: each step chooses, the radio group’s way."
        layout="stack"
      >
        <ColorPickerDefaultsProvider presets={BRAND}>
          <ColorPicker defaultValue="#DC2626" />
        </ColorPickerDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Contrast: Story = {
  parameters: scenario('contrast'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Text on white"
        note="Move the brightness down and watch the level cross from Fail to AA large, AA and AAA."
        layout="stack"
      >
        <Live contrastWith="#FFFFFF" initial="#94A3B8" />
      </Scene>
      <Scene
        label="Text on a dark header"
        note="The same panel against #0F172A: a light colour passes, the brand blue does not."
        layout="stack"
      >
        <Live contrastWith="#0F172A" initial="#F8FAFC" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Disabled"
        note="Out of the tab order; the colour greyed so nothing reads as choosable."
        layout="stack"
      >
        <ColorPicker defaultValue="#64748B" disabled />
      </Scene>
      <Scene
        label="Read-only"
        note="The sliders take focus and say their values; nothing moves."
        layout="stack"
      >
        <ColorPicker defaultValue="#DB2777" readOnly />
      </Scene>
      <Scene
        label="Outside sRGB"
        note="An oklch colour no screen in sRGB can show is said, and kept as written."
        layout="stack"
      >
        <ColorPicker defaultValue="oklch(0.9 0.3 150)" />
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Portuguese words and hsl, for the whole application"
        note="SlottedProvider sets the language and the provider the notation, once; the picker below states nothing of its own."
        layout="stack"
      >
        <SlottedProvider locale="pt-BR">
          <ColorPickerDefaultsProvider format="hsl">
            <ColorPicker defaultValue="hsl(221 83% 53%)" />
          </ColorPickerDefaultsProvider>
        </SlottedProvider>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Every slider and the palette from the keyboard"
        note="Tab to the area and use the arrows: right adds saturation, up adds brightness; Shift moves ten at a time. On the hue, Home and End go to the ends."
        layout="stack"
      >
        <Live initial="#0D9488" />
      </Scene>
    </Grid>
  ),
};
