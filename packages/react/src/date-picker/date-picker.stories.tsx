import { plainDate } from '@slotted/core/date';
import type { PlainDate } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import type { CalendarValue } from '../calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DatePicker } from './date-picker';
import { DatePickerDefaultsProvider } from './date-picker-defaults';
import { Grid, Measure, Scene } from './date-picker-demo';
import { REACT_DATE_PICKER_DOCS, REACT_DATE_PICKER_TOKENS } from './date-picker.docs';
import type { DatePickerHandle } from './date-picker.types';

const NINTH = plainDate(2026, 9, 9);

const isWeekend = (date: PlainDate) => {
  const day = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return day === 0 || day === 6;
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_PICKER_DOCS.datePicker.scenes, {
    playground: Playground,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    presets: Presets,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Picker',
        description:
          'A date field and a month grid behind one trigger, composed rather than redrawn: both halves keep their own identifier, their own keyboard and their own semantics, and this family owns the frame, the trigger and the layer between them.',
        framework: 'React',
        ...REACT_DATE_PICKER_DOCS.datePicker,
        tokens: REACT_DATE_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    locale: 'pt-BR',
    placement: 'bottom-start',
    selectionMode: 'single',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <DatePicker {...args} name="vencimento" />
        <FieldDescription>Type the date or choose from the calendar.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three steps"
        note="Type, height, padding and the trigger’s own box all follow the control scales, so a picker in a dense table shrinks whole rather than in parts."
      >
        <DatePicker aria-label="Small" defaultValue={NINTH} locale="pt-BR" size="sm" />
        <DatePicker aria-label="Default" defaultValue={NINTH} locale="pt-BR" size="md" />
        <DatePicker aria-label="Large" defaultValue={NINTH} locale="pt-BR" size="lg" />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The three frames"
        note="The trigger keeps its calendar mark in all three: what it says — this holds a date — does not change with how much border there is around it."
      >
        <DatePicker aria-label="Contorno" defaultValue={NINTH} locale="pt-BR" variant="outline" />
        <DatePicker aria-label="Discreto" defaultValue={NINTH} locale="pt-BR" variant="subtle" />
        <DatePicker aria-label="Simples" defaultValue={NINTH} locale="pt-BR" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Below, aligned to the start"
        note="The default. Open it and scroll the page: the positioner flips the surface when there is no longer room under the control."
      >
        <DatePicker
          aria-label="Below"
          defaultValue={NINTH}
          locale="pt-BR"
          placement="bottom-start"
        />
      </Scene>
      <Scene
        label="Above, aligned to the end"
        note="A preference rather than a promise: what the positioner resolved is on the layer as data-placement, which is what a test reads."
      >
        <DatePicker aria-label="Above" defaultValue={NINTH} locale="pt-BR" placement="top-end" />
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One pair of props, both halves"
        note="Type 31/12/2025 into the field and it goes invalid; open the surface and the grid stops the reader at the first of January. Neither half was told separately."
      >
        <Field>
          <FieldLabel>Vencimento em 2026</FieldLabel>
          <DatePicker
            defaultValue={NINTH}
            locale="pt-BR"
            max={plainDate(2026, 12, 31)}
            min={plainDate(2026, 1, 1)}
          />
          <FieldError>Escolha uma data de 2026.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="No weekends, in both halves"
        note="The grid strikes a Saturday through and refuses the press; the field marks the same date invalid when it is typed. One predicate, two answers, no duplication."
      >
        <Field>
          <FieldLabel>Delivery</FieldLabel>
          <DatePicker defaultValue={NINTH} isDateUnavailable={isWeekend} locale="pt-BR" />
          <FieldError>We deliver only on business days.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: function PresetsStory() {
    const [value, setValue] = useState<CalendarValue>(NINTH);

    return (
      <Grid columns={1}>
        <Scene
          label="The two slots the consumer fills"
          note="The shortcuts stand in a column beside the grid and the actions under it. The labels and the dates are the product’s: a preset list in the contract would be this library guessing at a fiscal year."
        >
          <DatePicker
            aria-label="Com atalhos"
            footer={
              <Button size="sm" variant="ghost">
                Limpar
              </Button>
            }
            locale="pt-BR"
            onValueChange={setValue}
            presets={
              <>
                <Button onClick={() => setValue(NINTH)} size="sm" variant="ghost">
                  Today
                </Button>
                <Button onClick={() => setValue(plainDate(2026, 9, 10))} size="sm" variant="ghost">
                  Tomorrow
                </Button>
                <Button onClick={() => setValue(plainDate(2026, 10, 9))} size="sm" variant="ghost">
                  Daqui a 30 dias
                </Button>
              </>
            }
            value={value}
          />
        </Scene>
      </Grid>
    );
  },
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Read-only"
        note="The value is legible and copyable and the trigger is out of the tab sequence: a surface that opened onto a grid nothing answers is worse than no surface at all."
      >
        <DatePicker aria-label="Somente leitura" defaultValue={NINTH} locale="pt-BR" readOnly />
      </Scene>
      <Scene
        label="Disabled"
        note="Nothing answers, nothing is in the tab sequence, and the date is still readable — a disabled form still has to say what it holds."
      >
        <DatePicker aria-label="Desativado" defaultValue={NINTH} disabled locale="pt-BR" />
      </Scene>
      <Scene
        label="Invalid"
        note="Tab into the field and then into the trigger: the ring is retargeted to the danger colour on both, from one custom property the frame points at the error."
      >
        <DatePicker aria-label="Invalid" defaultValue={NINTH} invalid locale="pt-BR" />
      </Scene>
      <Scene
        label="Required"
        note="The field draws the necessity mark and its group carries aria-required, so the fact is both seen and heard."
      >
        <Field required>
          <FieldLabel>Vencimento</FieldLabel>
          <DatePicker locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: function FormsStory() {
    const [posted, setPosted] = useState<string | null>(null);

    return (
      <Grid columns={1}>
        <Scene
          label="A plain form post"
          note="Choose a date in the grid and submit: the hidden input sends 2026-09-17 under the name, whether the reader typed it or pressed it."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPosted(String(new FormData(event.currentTarget).get('entrada') ?? ''));
            }}
          >
            <Field>
              <FieldLabel>Entrada</FieldLabel>
              <DatePicker defaultValue={NINTH} locale="pt-BR" name="entrada" required />
              <FieldDescription>
                {posted === null ? 'Not sent yet.' : `Sent: ${posted}`}
              </FieldDescription>
            </Field>
            <Button type="submit">Reservar</Button>
          </form>
        </Scene>
      </Grid>
    );
  },
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In a narrow column"
        note="The control holds and the surface is measured against the room there is. On a coarse pointer below 480 pixels it becomes a sheet on the bottom edge, and the DOM says which one it is."
      >
        <Measure>
          <DatePicker aria-label="Estreito" defaultValue={NINTH} locale="pt-BR" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<DatePickerHandle | null>(null);

    return (
      <Grid columns={1}>
        <Scene
          label="Set once for the application"
          note="One provider decides the zone for every picker under it, and SlottedProvider the language that writes the date and names the trigger, so a product does not repeat them on each form."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <DatePickerDefaultsProvider timeZone="America/Sao_Paulo">
              <DatePicker aria-label="Herdado" defaultValue={NINTH} />
            </DatePickerDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="The imperative handle"
          note="open(), close() and focus() are the three actions no prop can express. Press the buttons: the surface moves without the consumer owning the open state."
          layout="stack"
        >
          <DatePicker aria-label="Controlado" defaultValue={NINTH} locale="pt-BR" ref={handle} />
          <Button onClick={() => handle.current?.open()} variant="outline">
            open()
          </Button>
          <Button onClick={() => handle.current?.close()} variant="outline">
            close()
          </Button>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The chord, and the staged Escape"
        note="Focus a segment and press Alt+ArrowDown. Then press the heading twice and press Escape three times: the first two walk the views down and only the third closes the surface."
      >
        <DatePicker aria-label="Teclado" defaultValue={NINTH} locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};
