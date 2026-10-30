import { plainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { Grid, Measure, Scene } from '../time-field/time-field-demo';
import { TimePicker } from './time-picker';
import { TimePickerDefaultsProvider } from './time-picker-defaults';
import { REACT_TIME_PICKER_DOCS, REACT_TIME_PICKER_TOKENS } from './time-picker.docs';
import type { TimePickerHandle } from './time-picker.types';

const TEN = plainTime(10, 0);
const MORNING = plainTime(9, 0);
const EVENING = plainTime(18, 0);
/** Stated rather than read from the clock, so every scene reads the same twice. */
const NOW = plainTime(9, 47);

/** A clinic's own hours: no step describes them, and `options` states them. */
const CLINIC = [
  plainTime(9, 0),
  plainTime(9, 20),
  plainTime(11, 40),
  plainTime(13, 45),
  plainTime(16, 0),
];
const MARKS = [plainTime(0, 0, 15), plainTime(0, 0, 30), plainTime(0, 0, 45), plainTime(0, 1, 0)];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIME_PICKER_DOCS.timePicker.scenes, {
    playground: Playground,
    panel: Panel,
    explicit: Explicit,
    seconds: Seconds,
    step: Step,
    'range-bounds': RangeBounds,
    unavailable: Unavailable,
    now: Now,
    relative: Relative,
    presets: Presets,
    sizes: Sizes,
    variants: Variants,
    placement: Placement,
    states: States,
    forms: Forms,
    narrow: Narrow,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/TimePicker',
  component: TimePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Picker',
        description:
          'A time field, a trigger, and a list of times behind them. One panel shape at every step — a listbox of whole times — because the field beside it already types every second, and `options` states any set a step cannot describe. The panel complements the typing and never blocks it.',
        framework: 'React',
        ...REACT_TIME_PICKER_DOCS.timePicker,
        tokens: REACT_TIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every open panel needs room under it, and the stage is what gives it. */
const Tall = ({ children }: { children: React.ReactNode }) => (
  <div className="slotted-demo-viewport" data-size="tall">
    {children}
  </div>
);

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    locale: 'pt-BR',
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Start time</FieldLabel>
        <TimePicker {...args} name="start" referenceTime={NOW} />
        <FieldDescription>Choose from the list or type in the field.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A listbox of whole times"
        note="Every row says the whole time, which is what a reader choosing a slot reads at a glance. One axis is also what makes Home, End, type-ahead and the two arrows all mean something — a column panel would have halved each of them."
      >
        <Tall>
          <TimePicker
            aria-label="Hora"
            defaultOpen
            defaultValue={TEN}
            locale="pt-BR"
            max={plainTime(11, 30)}
            min={MORNING}
            referenceTime={NOW}
            step={1800}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Explicit: Story = {
  parameters: scenario('explicit'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A clinic's own hours"
        note="09:00, 09:20, 11:40, 13:45, 16:00. No step describes that, and a predicate can only subtract from times that fall on one — so options states them outright, in the order the consumer means. It is half the answer to why this family needs no column panel."
      >
        <Tall>
          <TimePicker
            aria-label="Hora da consulta"
            defaultOpen
            defaultValue={plainTime(11, 40)}
            locale="pt-BR"
            options={CLINIC}
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Marks of a few seconds"
        note="The other half. A day at a one-second step is 86 400 rows and not a list; a stated set of marks is four, and the field beside the panel types any second the list does not offer."
      >
        <Tall>
          <TimePicker
            aria-label="Marca do intervalo"
            defaultOpen
            defaultValue={plainTime(0, 0, 30)}
            granularity="second"
            locale="pt-BR"
            options={MARKS}
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="An hour, and a quarter of one"
        note="A step in seconds. The list is what the step makes it, and the field beside it still accepts anything between two rows."
      >
        <TimePicker aria-label="Hora cheia" locale="pt-BR" referenceTime={NOW} step={3600} />
        <TimePicker aria-label="Quarto de hora" locale="pt-BR" referenceTime={NOW} step={900} />
      </Scene>
      <Scene
        label="Counted from the lower bound"
        note="min 09:07 with a quarter-hour step offers 09:07, 09:22, 09:37 — the platform’s own rule for input[type=time], and one no surveyed panel states. Open it and read the first three rows."
      >
        <Tall>
          <TimePicker
            aria-label="Base"
            defaultOpen
            locale="pt-BR"
            max={plainTime(10, 30)}
            min={plainTime(9, 7)}
            referenceTime={NOW}
            step={900}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Inside the hours"
        note="min and max fence the list and the value together: nothing outside them is offered, and nothing outside them is accepted."
      >
        <TimePicker
          aria-label="Dentro"
          defaultValue={plainTime(11, 30)}
          locale="pt-BR"
          max={EVENING}
          min={MORNING}
          referenceTime={NOW}
        />
      </Scene>
      <Scene
        label="Outside them"
        note="A value past the fence is invalid whatever the field around the picker says, and the ring on the control and on the trigger retarget together."
      >
        <TimePicker
          aria-label="Fora"
          defaultValue={plainTime(20, 0)}
          locale="pt-BR"
          max={EVENING}
          min={MORNING}
          referenceTime={NOW}
        />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Disabled, which is the default"
        note="The noon hour stays in the list and answers nothing. A list that silently drops rows is a list whose step the reader cannot infer."
      >
        <Tall>
          <TimePicker
            aria-label="Desativadas"
            defaultOpen
            isTimeUnavailable={(time) => time.hour === 12}
            locale="pt-BR"
            max={plainTime(13, 0)}
            min={plainTime(11, 0)}
            referenceTime={NOW}
            step={1800}
          />
        </Tall>
      </Scene>
      <Scene
        label="Hidden, which is the consumer's choice"
        note="The same predicate with unavailableOptions='hide'. The rows are gone and the step is no longer readable from the list — which is why it is not the default."
      >
        <Tall>
          <TimePicker
            aria-label="Escondidas"
            defaultOpen
            isTimeUnavailable={(time) => time.hour === 12}
            locale="pt-BR"
            max={plainTime(13, 0)}
            min={plainTime(11, 0)}
            referenceTime={NOW}
            step={1800}
            unavailableOptions="hide"
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One press for the current time"
        note="It is the zero case of the field’s relative expression, drawn as a labelled control so a reader who never discovers that + opens a duration still has the one press. The reference is stated here, so it reads 09:47 every time."
      >
        <Tall>
          <TimePicker
            aria-label="Agora"
            defaultOpen
            locale="pt-BR"
            max={plainTime(11, 0)}
            min={MORNING}
            messages={{ now: 'Agora' }}
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The panel complements the typing"
        note="Put focus in the field and press Alt+ArrowDown: the panel opens and focus stays on the segments, so every key the field had still works. Press + and the duration expression opens with the panel still showing. §6 of the feature guide asks for exactly this."
      >
        <Tall>
          <TimePicker
            aria-label="A escrever"
            defaultValue={TEN}
            locale="pt-BR"
            max={plainTime(11, 0)}
            min={MORNING}
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Shortcuts and actions the product owns"
        note="This family ships no list of shortcuts: 'start of the shift' is a business clock. What it ships is the column they stand in — and the surface stops being the anchor’s width once they are there, so the times keep a column worth reading."
      >
        <Tall>
          <TimePicker
            aria-label="Com atalhos"
            closeOnSelect="never"
            defaultOpen
            footer={
              <Button size="sm" variant="solid">
                Aplicar
              </Button>
            }
            locale="pt-BR"
            max={plainTime(11, 0)}
            min={MORNING}
            presets={
              <>
                <Button size="sm" tone="secondary" variant="ghost">
                  Start of shift
                </Button>
                <Button size="sm" tone="secondary" variant="ghost">
                  Lunch
                </Button>
              </>
            }
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="On its own"
        note="Three steps of type, height and inside padding, and the trigger’s own box follows each."
      >
        <TimePicker
          aria-label="Pequeno"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          size="sm"
        />
        <TimePicker
          aria-label="Default"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          size="md"
        />
        <TimePicker
          aria-label="Grande"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          size="lg"
        />
      </Scene>
      <Scene
        label="Inside a field"
        note="The picker takes the field’s step rather than its own default, so a form cannot end up with a small field holding a medium control on one row."
      >
        <Field size="sm">
          <FieldLabel>Start time</FieldLabel>
          <TimePicker defaultValue={TEN} locale="pt-BR" referenceTime={NOW} />
        </Field>
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
        note="How much the control shows at rest. The panel does not change with it: a surface floating over the page has its own ground whatever the control below it looks like."
      >
        <TimePicker
          aria-label="Outline"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          variant="outline"
        />
        <TimePicker
          aria-label="Subtle"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          variant="subtle"
        />
        <TimePicker
          aria-label="Plain"
          defaultValue={TEN}
          locale="pt-BR"
          referenceTime={NOW}
          variant="plain"
        />
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Below, from the start edge"
        note="The default, and where a form wants it. What the positioner actually resolved is written back as data-placement."
      >
        <Tall>
          <TimePicker
            aria-label="Below"
            defaultOpen
            locale="pt-BR"
            max={plainTime(11, 0)}
            min={MORNING}
            placement="bottom-start"
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
      <Scene
        label="Above, from the end edge"
        note="The same surface asked to start elsewhere. It still moves if the room says so — the axis is a starting point, not a promise."
      >
        <Tall>
          <TimePicker
            aria-label="Above"
            defaultOpen
            locale="pt-BR"
            max={plainTime(11, 0)}
            min={MORNING}
            placement="top-end"
            referenceTime={NOW}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Read-only and disabled"
        note="Read-only keeps the value readable and the panel shut; disabled answers no press at all and stays legible rather than faded."
      >
        <TimePicker
          aria-label="Read-only"
          defaultValue={TEN}
          locale="pt-BR"
          readOnly
          referenceTime={NOW}
        />
        <TimePicker
          aria-label="Desativado"
          defaultValue={TEN}
          disabled
          locale="pt-BR"
          referenceTime={NOW}
        />
      </Scene>
      <Scene
        label="Invalid and required, in a field"
        note="The message is the field’s and the state is the control’s. The ring retargets on the frame and on the trigger together, so the two never disagree."
      >
        <Field invalid>
          <FieldLabel>Start time</FieldLabel>
          <TimePicker
            defaultValue={plainTime(20, 0)}
            locale="pt-BR"
            max={EVENING}
            referenceTime={NOW}
          />
          <FieldError>Outside service hours.</FieldError>
        </Field>
        <Field required>
          <FieldLabel>Hora de fim</FieldLabel>
          <TimePicker locale="pt-BR" referenceTime={NOW} />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A plain post"
        note="The field’s hidden input carries HH:mm:ss under the name, so a server reads the value without any JavaScript touching the control."
      >
        <form
          action="/agendar"
          method="post"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Field>
            <FieldLabel>Start time</FieldLabel>
            <TimePicker
              defaultValue={TEN}
              locale="pt-BR"
              name="start"
              referenceTime={NOW}
              required
            />
            <FieldDescription>Sent as 10:00:00.</FieldDescription>
          </Field>
          <Button type="submit">Schedule</Button>
        </form>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In a narrow column"
        note="The panel takes the anchor’s width, floored so a narrow field never produces a column too tight to read a time in. Below 480 pixels on a finger it becomes a sheet instead, and the DOM says which presentation it is in."
      >
        <Measure>
          <Tall>
            <TimePicker
              aria-label="Estreito"
              defaultOpen
              locale="pt-BR"
              max={plainTime(11, 0)}
              min={MORNING}
              referenceTime={NOW}
            />
          </Tall>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    function Held() {
      const handle = useRef<TimePickerHandle | null>(null);
      return (
        <>
          <TimePicker
            aria-label="Com handle"
            defaultValue={TEN}
            locale="pt-BR"
            ref={handle}
            referenceTime={NOW}
          />
          <Button onClick={() => handle.current?.open()} size="sm" variant="outline">
            Open
          </Button>
          <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
            Focar
          </Button>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="Set once, and drawn by the consumer"
          note="The provider states the step for everything under it, and renderOption draws what is inside a row — the row itself, with its role, its states and its keyboard, stays the family’s."
        >
          <Tall>
            <TimePickerDefaultsProvider step={1200}>
              <TimePicker
                aria-label="With its own rows"
                defaultOpen
                locale="pt-BR"
                max={plainTime(11, 0)}
                min={MORNING}
                referenceTime={NOW}
                renderOption={(option) => (
                  <>
                    <span>{option.label}</span>
                    {option.selected ? <span>·</span> : null}
                  </>
                )}
              />
            </TimePickerDefaultsProvider>
          </Tall>
        </Scene>
        <Scene
          collapseFloor={40}
          label="The handle"
          note="open() and close() move the surface without a pointer, and focus() puts the reader on the first segment. None of the three can be expressed as a prop, which is the whole test for what belongs on a ref."
          layout="row"
        >
          <Held />
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
        label="Put focus in it and try them"
        note="Alt+ArrowDown from a segment opens the panel and leaves focus there. Tab to the trigger and press ArrowDown to move into the list; inside it the arrows walk, Home and End reach the ends, PageUp and PageDown cross one hour boundary each, digits jump to a time, and Enter chooses. Escape closes and puts focus back on the trigger."
      >
        <Tall>
          <TimePicker
            aria-label="Teclado"
            defaultValue={TEN}
            locale="pt-BR"
            max={plainTime(12, 0)}
            min={MORNING}
            referenceTime={NOW}
            step={900}
          />
        </Tall>
      </Scene>
    </Grid>
  ),
};
