import { plainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import type { PlainTime } from '@slotted/core/date';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clock } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Icon } from '../icon';
import { TimeField } from './time-field';
import { TimeFieldDefaultsProvider } from './time-field-defaults';
import { Grid, Measure, Scene } from './time-field-demo';
import { REACT_TIME_FIELD_DOCS, REACT_TIME_FIELD_TOKENS } from './time-field.docs';
import type { TimeFieldChangeRequest, TimeFieldHandle } from './time-field.types';

const HALF_PAST_TWO = plainTime(14, 30);
const QUARTER_PAST_NINE = plainTime(9, 15);
/** Stated rather than read from the clock, so every scene reads the same twice. */
const AFTERNOON = plainTime(14, 40);
const LATE = plainTime(23, 0);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TIME_FIELD_DOCS.timeField.scenes, {
    playground: Playground,
    locale: Locale,
    'hour-cycle': HourCycle,
    granularity: Granularity,
    relative: Relative,
    midnight: Midnight,
    sizes: Sizes,
    variants: Variants,
    range: Range,
    unavailable: Unavailable,
    states: States,
    clear: Clear,
    adornments: Adornments,
    forms: Forms,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/TimeField',
  component: TimeField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Time Field',
        description:
          'A time typed one field at a time, in the order the reader’s own locale writes it — and, when the reader would rather say "forty minutes from now", a duration resolved in view before it is accepted. Each field is a spin button; together they are one group whose name is the whole time; and the value reaches a form as an HH:mm:ss string without anything reading the control.',
        framework: 'React',
        ...REACT_TIME_FIELD_DOCS.timeField,
        tokens: REACT_TIME_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof TimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    granularity: 'minute',
    locale: 'pt-BR',
    relative: true,
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Start time</FieldLabel>
        <TimeField {...args} name="start" />
        <FieldDescription>The meeting starts at this time.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Locale: Story = {
  parameters: scenario('locale'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="pt-BR"
        note="Hour and minute, separated by a colon, with an empty hh:mm — all three things come from Intl, and no day period because the locale does not write one."
      >
        <TimeField aria-label="Hour" defaultValue={HALF_PAST_TWO} locale="pt-BR" />
        <TimeField aria-label="Hora vazia" locale="pt-BR" />
      </Scene>
      <Scene
        label="en-US"
        note="The same component, with a third field: the day period, whose spoken value is AM or PM because 0 and 1 are not names."
      >
        <TimeField aria-label="Time" defaultValue={HALF_PAST_TWO} locale="en-US" />
        <TimeField aria-label="Empty time" locale="en-US" />
      </Scene>
      <Scene
        label="ja-JP"
        note="午前 and 午後 come first here, before the hour — the pattern order is the locale’s and the family only reads it."
      >
        <TimeField aria-label="時刻" defaultValue={HALF_PAST_TWO} hourCycle={12} locale="ja-JP" />
        <TimeField aria-label="空の時刻" hourCycle={12} locale="ja-JP" />
      </Scene>
      <Scene
        label="ar-EG"
        note="The locale’s own digits, read back by the same parser that wrote them: ١٤:٣٠ is a time this field types and a paste it accepts."
      >
        <TimeField aria-label="الوقت" defaultValue={HALF_PAST_TWO} locale="ar-EG" />
        <TimeField aria-label="وقت فارغ" locale="ar-EG" />
      </Scene>
    </Grid>
  ),
};

export const HourCycle: Story = {
  parameters: scenario('hour-cycle'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Twelve, in en-US"
        note="h12: the hour runs 1 to 12 and midnight is written 12 AM. Step the hour past twelve and it wraps inside its own field rather than moving the day period."
      >
        <TimeField
          aria-label="Twelve"
          defaultValue={plainTime(0, 30)}
          hourCycle={12}
          locale="en-US"
        />
      </Scene>
      <Scene
        label="Twelve, in ja-JP"
        note="h11: the same axis, and the hour runs 0 to 11. A boolean would have written 12 here, which is wrong in a way nobody notices until a Japanese reader reports it."
      >
        <TimeField
          aria-label="Eleven"
          defaultValue={plainTime(0, 30)}
          hourCycle={12}
          locale="ja-JP"
        />
      </Scene>
      <Scene
        label="Twenty-four"
        note="h23: no day period at all, and the hour runs 0 to 23. The field draws one fewer spin button, and the group’s name still says the whole time."
      >
        <TimeField
          aria-label="Twenty-four"
          defaultValue={plainTime(0, 30)}
          hourCycle={24}
          locale="en-US"
        />
      </Scene>
      <Scene
        label="What the locale wants"
        note="Unset, each control asks Intl and gets what the reader’s own locale writes — which is the answer a form should ship with."
      >
        <TimeField aria-label="Locale" defaultValue={plainTime(0, 30)} locale="pt-BR" />
        <TimeField aria-label="Locale en" defaultValue={plainTime(0, 30)} locale="en-US" />
      </Scene>
    </Grid>
  ),
};

export const Granularity: Story = {
  parameters: scenario('granularity'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three depths"
        note="An hour for a booking that only takes hours, a minute for nearly everything, a second for a timecode. The value carries what the field draws and nothing more."
      >
        <TimeField
          aria-label="Hora da reserva"
          defaultValue={HALF_PAST_TWO}
          granularity="hour"
          locale="pt-BR"
        />
        <TimeField
          aria-label="Meeting time"
          defaultValue={HALF_PAST_TWO}
          granularity="minute"
          locale="pt-BR"
        />
        <TimeField
          aria-label="Video timestamp"
          defaultValue={plainTime(14, 30, 15)}
          granularity="second"
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Press + and write a duration"
        note="+40m, 1h30, 1:30, -15, 90s, or 0 for now. The resolved time is drawn on the right as you type; Enter accepts it and the segments come back holding it, Escape puts them back untouched. The reference is stated here so the demonstration reads the same twice."
      >
        <TimeField aria-label="Duration" locale="pt-BR" referenceTime={AFTERNOON} />
      </Scene>
      <Scene
        label="Every value it writes is reachable without it"
        note="The expression is a shortcut, never the only way in: the same 15:20 is typed digit by digit, stepped with the arrows, or paged with PageUp. A reader who never presses + loses nothing but the shortcut."
      >
        <TimeField
          aria-label="No duration"
          locale="pt-BR"
          referenceTime={AFTERNOON}
          relative={false}
        />
      </Scene>
    </Grid>
  ),
};

export const Midnight: Story = {
  parameters: scenario('midnight'),
  render: () => {
    function Crossing() {
      const [last, setLast] = useState<string>('—');
      return (
        <>
          <TimeField
            aria-label="Fim do turno"
            locale="pt-BR"
            messages={{ nextDay: '{time} no dia seguinte' }}
            onValueChange={(value: PlainTime | null, request: TimeFieldChangeRequest) =>
              setLast(
                value === null
                  ? '—'
                  : `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')} · crossesMidnight ${String(request.crossesMidnight)}`,
              )
            }
            referenceTime={LATE}
          />
          <FieldDescription>Last request: {last}</FieldDescription>
        </>
      );
    }

    return (
      <Grid columns={1}>
        <Scene
          label="+90m at 23:00"
          note="Press + and write 90m. The preview changes tone and says the day out loud, and the request carries crossesMidnight so a consumer holding a PlainDateTime knows to add one. Nothing else surveyed says anything at all here."
        >
          <Crossing />
        </Scene>
      </Grid>
    );
  },
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="On its own"
        note="Three steps of type, height and inside padding, all from the control scales the theme restates per density."
      >
        <TimeField aria-label="Small" defaultValue={HALF_PAST_TWO} locale="pt-BR" size="sm" />
        <TimeField aria-label="Default" defaultValue={HALF_PAST_TWO} locale="pt-BR" size="md" />
        <TimeField aria-label="Large" defaultValue={HALF_PAST_TWO} locale="pt-BR" size="lg" />
      </Scene>
      <Scene
        label="Inside a field"
        note="The control takes the field’s step rather than its own default: a small field holding a medium control is one row disagreeing with itself."
      >
        <Field size="sm">
          <FieldLabel>Start time</FieldLabel>
          <TimeField defaultValue={HALF_PAST_TWO} locale="pt-BR" />
        </Field>
        <Field size="lg">
          <FieldLabel>Hora de fim</FieldLabel>
          <TimeField defaultValue={plainTime(18, 0)} locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="On the page"
        note="outline takes the ground it is on, subtle sinks into it, and plain shows nothing at rest — the same three steps text-field set, so a form shows one frame twice."
      >
        <TimeField
          aria-label="Outline"
          defaultValue={HALF_PAST_TWO}
          locale="pt-BR"
          variant="outline"
        />
        <TimeField
          aria-label="Subtle"
          defaultValue={HALF_PAST_TWO}
          locale="pt-BR"
          variant="subtle"
        />
        <TimeField aria-label="Plain" defaultValue={HALF_PAST_TWO} locale="pt-BR" variant="plain" />
      </Scene>
      <Scene
        label="In a dense row"
        note="plain is what a table wants: nothing until the pointer or the keyboard arrives, and a full frame the moment it does."
        layout="row"
      >
        <TimeField
          aria-label="Entrada"
          defaultValue={plainTime(8, 0)}
          locale="pt-BR"
          size="sm"
          variant="plain"
        />
        <TimeField
          aria-label="Exit"
          defaultValue={plainTime(17, 30)}
          locale="pt-BR"
          size="sm"
          variant="plain"
        />
      </Scene>
    </Grid>
  ),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Inside the hours"
        note="09:00 to 18:00. The bounds reach the spin buttons as aria-valuemin and aria-valuemax, so a screen reader hears the fence rather than discovering it."
      >
        <TimeField
          aria-label="Dentro"
          defaultValue={plainTime(11, 30)}
          locale="pt-BR"
          max={plainTime(18, 0)}
          min={plainTime(9, 0)}
        />
      </Scene>
      <Scene
        label="Outside them"
        note="A value past the fence is invalid whatever the field around it says, because the control is the only thing that knows. The ring retargets and the group carries aria-invalid."
      >
        <TimeField
          aria-label="Fora"
          defaultValue={plainTime(20, 0)}
          locale="pt-BR"
          max={plainTime(18, 0)}
          min={plainTime(9, 0)}
        />
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A lunch break"
        note="isTimeUnavailable refuses the noon hour — something no pair of bounds can say. The second control holds a refused time and reports it; the first holds an accepted one."
      >
        <TimeField
          aria-label="Aceite"
          defaultValue={plainTime(11, 0)}
          isTimeUnavailable={(time) => time.hour === 12}
          locale="pt-BR"
        />
        <TimeField
          aria-label="Recusada"
          defaultValue={plainTime(12, 30)}
          isTimeUnavailable={(time) => time.hour === 12}
          locale="pt-BR"
        />
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
        note="Read-only stays focusable and copyable and never looks disabled — the value is real and still submitted. Disabled answers no key and no pointer, and stays legible rather than faded."
      >
        <TimeField aria-label="Read-only" defaultValue={HALF_PAST_TWO} locale="pt-BR" readOnly />
        <TimeField aria-label="Desativada" defaultValue={HALF_PAST_TWO} disabled locale="pt-BR" />
      </Scene>
      <Scene
        label="Invalid and required, in a field"
        note="The message is the field’s and the state is the control’s. Color alone never says invalid: the group carries aria-invalid and the error is associated by id."
      >
        <Field invalid>
          <FieldLabel>Start time</FieldLabel>
          <TimeField defaultValue={plainTime(20, 0)} locale="pt-BR" max={plainTime(18, 0)} />
          <FieldError>Outside service hours.</FieldError>
        </Field>
        <Field required>
          <FieldLabel>Hora de fim</FieldLabel>
          <TimeField locale="pt-BR" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Clear: Story = {
  parameters: scenario('clear'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="With a value"
        note="The button is drawn only once a segment holds something. Pressing it empties every field, emits the clear reason and puts focus back on the first segment rather than leaving it nowhere."
      >
        <TimeField
          aria-label="With value"
          clearable
          messages={{ clear: 'Clear the time' }}
          defaultValue={HALF_PAST_TWO}
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="Empty"
        note="Nothing to clear, so nothing is drawn — and the value keeps its place rather than shifting sideways when the button appears."
      >
        <TimeField
          aria-label="Vazia"
          clearable
          locale="pt-BR"
          messages={{ clear: 'Limpar a hora' }}
        />
      </Scene>
    </Grid>
  ),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A mark before the time"
        note="An icon in the start slot, sized from the control’s own glyph scale rather than from a number the consumer picks."
      >
        <TimeField
          aria-label="Com marca"
          clearable
          defaultValue={HALF_PAST_TWO}
          locale="pt-BR"
          start={
            <Icon>
              <Clock />
            </Icon>
          }
        />
      </Scene>
      <Scene
        label="A zone after it"
        note="The value is a wall-clock time and carries no zone; an application that knows the zone writes its label here. That is the composition the inventory names instead of a zone in the value."
      >
        <TimeField
          aria-label="Com fuso"
          defaultValue={HALF_PAST_TWO}
          end={<span>BRT</span>}
          locale="pt-BR"
        />
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
        note="The hidden input carries HH:mm:ss under the name, so a server reads the value without any JavaScript touching the control. A half-typed time posts nothing at all, because it is not a time."
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
            <TimeField defaultValue={QUARTER_PAST_NINE} locale="pt-BR" name="start" required />
            <FieldDescription>Sent as 09:15:00.</FieldDescription>
          </Field>
          <Button type="submit">Agendar</Button>
        </form>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A day period written as a word"
        note="es-MX writes a.m. and p.m., and a box cut to two characters would clip the dots. The part is sized by what it holds, with a floor under it."
      >
        <TimeField
          aria-label="Palabra"
          defaultValue={HALF_PAST_TWO}
          hourCycle={12}
          locale="es-MX"
        />
      </Scene>
      <Scene
        label="Seconds in a narrow column"
        note="Three fields and two separators at 240 pixels, at the small step. Nothing wraps and nothing is cut: the segments are sized from the digits they hold."
      >
        <Measure>
          <TimeField
            aria-label="Estreito"
            clearable
            defaultValue={plainTime(14, 30, 15)}
            granularity="second"
            locale="pt-BR"
            size="sm"
          />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    function Held() {
      const handle = useRef<TimeFieldHandle | null>(null);
      return (
        <>
          <TimeField
            aria-label="Com handle"
            defaultValue={HALF_PAST_TWO}
            locale="pt-BR"
            ref={handle}
          />
          <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
            Focar
          </Button>
          <Button onClick={() => handle.current?.clear()} size="sm" variant="outline">
            Limpar
          </Button>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="Set once for the application"
          note="The provider states the clock for everything under it, and SlottedProvider the language. A control that states any of them itself still wins — the second one here asks for en-US and gets it."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <TimeFieldDefaultsProvider hourCycle={24}>
              <TimeField aria-label="From the provider" defaultValue={HALF_PAST_TWO} />
              <TimeField aria-label="Its own" defaultValue={HALF_PAST_TWO} locale="en-US" />
            </TimeFieldDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          collapseFloor={40}
          label="The handle"
          note="focus() puts the reader on the first segment and clear() empties the value with the clear reason. Neither can be expressed as a prop, which is the whole test for what belongs on a ref."
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
        note="Arrows step and wrap inside one field; PageUp and PageDown move three hours or fifteen minutes; Home and End take a field to its own edge; the arrows across walk between fields in the writing order; Backspace empties one; digits type; and +, - or = open a duration. Every key the field acts on is stopped, so a page-level shortcut never fires while a reader is typing a time."
      >
        <TimeField
          aria-label="Teclado"
          defaultValue={HALF_PAST_TWO}
          clearable
          locale="pt-BR"
          referenceTime={AFTERNOON}
        />
      </Scene>
    </Grid>
  ),
};
