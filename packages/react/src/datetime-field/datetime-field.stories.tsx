import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarClock } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Icon } from '../icon';
import { DateTimeField } from './datetime-field';
import { DateTimeFieldDefaultsProvider } from './datetime-field-defaults';
import { Grid, Measure, Scene } from './datetime-field-demo';
import { REACT_DATE_TIME_FIELD_DOCS, REACT_DATE_TIME_FIELD_TOKENS } from './datetime-field.docs';
import type { DateTimeFieldChangeRequest, DateTimeFieldHandle } from './datetime-field.types';

/** A consultation on a Thursday afternoon, and the clinic it belongs to. */
const CONSULTATION = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
const EARLY = plainDateTime(plainDate(2026, 9, 10), plainTime(8, 30));
/** Stated rather than read from the clock, so every scene reads the same twice. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(14, 40));
const LAST_NIGHT_OF_THE_MONTH = plainDateTime(plainDate(2026, 9, 30), plainTime(23, 0));
const END_OF_JANUARY = plainDateTime(plainDate(2026, 1, 31), plainTime(15, 20));

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_TIME_FIELD_DOCS.dateTimeField.scenes, {
    playground: Playground,
    locale: Locale,
    'hour-cycle': HourCycle,
    granularity: Granularity,
    incomplete: Incomplete,
    relative: Relative,
    'rolls-day': RollsDay,
    sizes: Sizes,
    variants: Variants,
    range: Range,
    unavailable: Unavailable,
    narrow: Narrow,
    states: States,
    clear: Clear,
    adornments: Adornments,
    forms: Forms,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/DateTimeField',
  component: DateTimeField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DateTime Field',
        description:
          'A date and a time typed as one value, one field at a time, in the order the reader’s own locale writes both halves — and, when the reader would rather say "two days from now", a duration resolved in view before it is accepted. It is not a date field beside a time field: one group, one value, and one run of typing that crosses from the year into the hour. The half that is still missing is said out loud, which no surveyed implementation can do.',
        framework: 'React',
        ...REACT_DATE_TIME_FIELD_DOCS.dateTimeField,
        tokens: REACT_DATE_TIME_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateTimeField>;

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
        <FieldLabel>Appointment start</FieldLabel>
        <DateTimeField {...args} name="start" />
        <FieldDescription>The appointment starts at this date and time.</FieldDescription>
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
        note="Day, month, year and then the time, with a comma between the two halves — all coming from a single Intl.DateTimeFormat, with no format string written by hand."
      >
        <DateTimeField aria-label="Start" defaultValue={CONSULTATION} locale="pt-BR" />
        <DateTimeField aria-label="Empty start" locale="pt-BR" />
      </Scene>
      <Scene
        label="en-US"
        note="The month leads, and a sixth field appears: the day period, whose spoken value is AM or PM because 0 and 1 are not names."
      >
        <DateTimeField aria-label="Starts" defaultValue={CONSULTATION} locale="en-US" />
        <DateTimeField aria-label="Empty" locale="en-US" />
      </Scene>
      <Scene
        label="ja-JP"
        note="The year comes first and the boundary between the halves is just a space — so nothing is drawn there and the gap of the line itself does the separating."
      >
        <DateTimeField aria-label="開始" defaultValue={CONSULTATION} locale="ja-JP" />
        <DateTimeField aria-label="空" locale="ja-JP" />
      </Scene>
      <Scene
        label="fr-FR"
        note="Same order as pt-BR and a different boundary: a space instead of the comma. Two separate families would never know which of the two the locale writes."
      >
        <DateTimeField aria-label="Début" defaultValue={CONSULTATION} locale="fr-FR" />
        <DateTimeField aria-label="Vide" locale="fr-FR" />
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
        <DateTimeField
          aria-label="Twelve"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(0, 30))}
          hourCycle={12}
          locale="en-US"
        />
      </Scene>
      <Scene
        label="Twelve, in ja-JP"
        note="h11: the same axis, and the hour runs 0 to 11 with 午前 written before it. A boolean would have put 12 there, which is wrong in a way nobody notices until a Japanese reader reports it."
      >
        <DateTimeField
          aria-label="Eleven"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(0, 30))}
          hourCycle={12}
          locale="ja-JP"
        />
      </Scene>
      <Scene
        label="Twenty-four"
        note="h23: no day period at all, and the hour runs 0 to 23. The field draws one fewer spin button, and the group’s name still says the whole value."
      >
        <DateTimeField
          aria-label="Twenty-four"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(0, 30))}
          hourCycle={24}
          locale="en-US"
        />
      </Scene>
      <Scene
        label="What the locale wants"
        note="Unset, each control asks Intl and gets what the reader’s own locale writes — which is the answer a form should ship with."
      >
        <DateTimeField aria-label="Locale pt" defaultValue={CONSULTATION} locale="pt-BR" />
        <DateTimeField aria-label="Locale en" defaultValue={CONSULTATION} locale="en-US" />
      </Scene>
    </Grid>
  ),
};

export const Granularity: Story = {
  parameters: scenario('granularity'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three depths, and a whole date under each"
        note="An hour for a shift, a minute for almost everything, a second for an audit log. The date half never shrinks: a datetime without a day is a date, and that family is date-field."
      >
        <DateTimeField
          aria-label="Turno"
          defaultValue={CONSULTATION}
          granularity="hour"
          locale="pt-BR"
        />
        <DateTimeField
          aria-label="Consulta"
          defaultValue={CONSULTATION}
          granularity="minute"
          locale="pt-BR"
        />
        <DateTimeField
          aria-label="Registo"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 45))}
          granularity="second"
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

function IncompleteDemo() {
  const [request, setRequest] = useState<DateTimeFieldChangeRequest | null>(null);

  return (
    <>
      <DateTimeField
        aria-label="Appointment start"
        locale="pt-BR"
        onValueChange={(_value, next) => setRequest(next)}
        referenceDateTime={REFERENCE}
      />
      <p className="slotted-demo-scene__note">
        {request === null
          ? 'Type only the day and leave the field: the frame warns and the value stays null.'
          : `incomplete: ${String(request.incomplete)} · day written: ${String(request.segments.day)}`}
      </p>
    </>
  );
}

export const Incomplete: Story = {
  parameters: scenario('incomplete'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Time missing"
        note="The day is written and the time is not. The value is null — what every implementation reports — and which half is missing is in the frame's data-incomplete, which none of them can say."
      >
        <DateTimeField
          aria-label="Date only"
          data-incomplete="time"
          defaultValue={undefined}
          locale="pt-BR"
          referenceDateTime={REFERENCE}
        />
        <IncompleteDemo />
      </Scene>
      <Scene
        label="Empty is not incomplete"
        note="A field where nobody wrote anything is not unfinished, and a frame that warned here would mark every field of a freshly opened form."
      >
        <DateTimeField aria-label="Empty" locale="pt-BR" referenceDateTime={REFERENCE} />
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The grammar"
        note="+40 is forty minutes, +40m the same, 1h30 and 1:30 an hour and a half, +2d two days, +1w a week, 0 and = now. The anchor is always now, never the value the field already holds."
      >
        <DateTimeField aria-label="Duration" locale="pt-BR" referenceDateTime={REFERENCE} />
      </Scene>
      <Scene
        label="Resolved in view"
        note="What the expression resolves to is drawn beside it before Enter accepts anything, and Escape returns the segments exactly as they were. No implementation surveyed reads a duration."
      >
        <DateTimeField
          aria-label="Preview"
          locale="pt-BR"
          messages={{ duration: 'Date and time as a duration from now' }}
          referenceDateTime={REFERENCE}
        />
      </Scene>
      <Scene
        label="Never the only input"
        note="Every value the expression writes is reachable by writing the segments and by the arrows. relative={false} removes the mode, and nothing is lost besides the shortcut."
      >
        <DateTimeField
          aria-label="No expression"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          relative={false}
        />
      </Scene>
      <Scene
        label="Paste opens too"
        note="Pasted text is read first in the locale's form, then as ISO 8601 and finally as a duration — so pasting +2d does the same as typing it."
      >
        <DateTimeField aria-label="Paste" locale="pt-BR" referenceDateTime={REFERENCE} />
      </Scene>
    </Grid>
  ),
};

export const RollsDay: Story = {
  parameters: scenario('rolls-day'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Where the time-field flag is spent"
        note="Type +2d or +90m on the last night of the month. There, a PlainTime has no day and the family can only raise crossesMidnight; here the day exists, the date changes and the preview writes it set apart from the time beside it."
      >
        <DateTimeField
          aria-label="End of month"
          locale="pt-BR"
          referenceDateTime={LAST_NIGHT_OF_THE_MONTH}
        />
        <DateTimeField aria-label="Meio da tarde" locale="pt-BR" referenceDateTime={REFERENCE} />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Three steps"
        note="Height, type and glyph move together. A control inside a field takes the field's step, so a form does not end up with a small field holding a medium control on the same line."
      >
        <DateTimeField
          aria-label="Pequeno"
          clearable
          defaultValue={CONSULTATION}
          locale="pt-BR"
          size="sm"
        />
        <DateTimeField
          aria-label="Medium"
          clearable
          defaultValue={CONSULTATION}
          locale="pt-BR"
          size="md"
        />
        <DateTimeField
          aria-label="Grande"
          clearable
          defaultValue={CONSULTATION}
          locale="pt-BR"
          size="lg"
        />
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="In a form"
        note="outline takes the ground it sits on; subtle sinks into the page. Both are the same frame text-field draws, so a form with a name and a date shows one frame twice and not two frames."
      >
        <DateTimeField
          aria-label="Contorno"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          variant="outline"
        />
        <DateTimeField
          aria-label="Discreto"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          variant="subtle"
        />
      </Scene>
      <Scene
        label="In a table row"
        note="plain shows nothing until used, which is what a dense table of appointments needs: one frame per row would be a grid of boxes."
        layout="stack"
      >
        <div className="slotted-demo-rows">
          <span>Ana Ribeiro</span>
          <DateTimeField
            aria-label="Consulta de Ana Ribeiro"
            defaultValue={CONSULTATION}
            locale="pt-BR"
            variant="plain"
          />
          <span>Bruce Sanders</span>
          <DateTimeField
            aria-label="Appointment of Bruce Sanders"
            defaultValue={EARLY}
            locale="pt-BR"
            variant="plain"
          />
        </div>
      </Scene>
    </Grid>
  ),
};

const CLINIC = {
  max: plainDateTime(plainDate(2026, 12, 20), plainTime(12, 0)),
  maxTime: plainTime(18, 0),
  min: plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0)),
  minTime: plainTime(9, 0),
};

export const Range: Story = {
  parameters: scenario('range'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Inside both fences"
        note="September 11 at 14:00 is the first time the schedule accepts, and September 15 at 10:00 is inside the window that repeats every day. Both pairs hold at the same time."
      >
        <DateTimeField
          aria-label="Dentro"
          defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(10, 0))}
          locale="pt-BR"
          {...CLINIC}
        />
      </Scene>
      <Scene
        label="Outside the day's window"
        note="20:00 on a day inside the range is refused by maxTime, even though it is well before max. This is the combination that MUI's validation page records failing to deliver."
      >
        <DateTimeField
          aria-label="Fora da janela"
          defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(20, 0))}
          locale="pt-BR"
          {...CLINIC}
        />
      </Scene>
      <Scene
        label="Before the start of the range"
        note="September 10 at 15:20 is inside the daily window and before min — refused by the whole-value pair, not by the window's."
      >
        <DateTimeField aria-label="Before" defaultValue={CONSULTATION} locale="pt-BR" {...CLINIC} />
      </Scene>
      <Scene
        label="The first day is partial"
        note="On the day of min itself the window starts at min and not at minTime — the rule MDN states for the platform and no surveyed script implements."
      >
        <DateTimeField
          aria-label="First day"
          defaultValue={plainDateTime(plainDate(2026, 9, 11), plainTime(10, 0))}
          locale="pt-BR"
          {...CLINIC}
        />
      </Scene>
    </Grid>
  ),
};

const isSunday = (date: PlainDate) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 0;

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A closed Sunday"
        note="isDateUnavailable answers for a whole day. It is the question a calendar cell asks, and it cannot be derived from a datetime predicate without walking every step of that day."
      >
        <DateTimeField
          aria-label="Domingo"
          defaultValue={plainDateTime(plainDate(2026, 9, 13), plainTime(10, 0))}
          isDateUnavailable={isSunday}
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="A lunch hour"
        note="isTimeUnavailable also receives the day, so a Saturday can close earlier than a Tuesday. Two predicates, because they are two questions."
      >
        <DateTimeField
          aria-label="Lunch"
          defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(12, 30))}
          isTimeUnavailable={(time: PlainTime) => time.hour === 12}
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The line breaks between the halves"
        note="Seven fields do not fit in a narrow column in any locale, and the line breaks between the two boxes and never inside one. No container query: the break holds at any width, so no threshold has to guess where the content stops fitting."
      >
        <Measure>
          <DateTimeField
            aria-label="Estreito"
            defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 45))}
            granularity="second"
            locale="pt-BR"
          />
        </Measure>
      </Scene>
      <Scene
        label="The comma stays at the end of the line"
        note="The boundary the locale writes is drawn at the end of the first half, not between the two — so a break leaves it where a comma in a sentence would stay."
      >
        <Measure>
          <DateTimeField aria-label="Narrow" defaultValue={CONSULTATION} locale="en-US" />
        </Measure>
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
        note="Read-only stays focusable and copyable and never looks like disabled: the value is still real and still submitted. Disabled responds to neither key nor pointer and stays legible."
      >
        <DateTimeField aria-label="Read-only" defaultValue={CONSULTATION} locale="pt-BR" readOnly />
        <DateTimeField
          aria-label="Desactivado"
          clearable
          defaultValue={CONSULTATION}
          disabled
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="Required and invalid"
        note="Required reaches the group as aria-required. Invalid keeps the focus ring and changes its color, because a control that reports an error must not stop looking wrong when the pointer passes over it."
      >
        <DateTimeField aria-label="Required" defaultValue={CONSULTATION} locale="pt-BR" required />
        <DateTimeField aria-label="Invalid" defaultValue={CONSULTATION} invalid locale="pt-BR" />
      </Scene>
      <Scene
        label="Incomplete is lower than invalid"
        note="A warning tone, one step below the danger the refused value receives — because nothing the reader wrote is wrong, only unfinished. And it yields to invalid when both are true."
      >
        <DateTimeField
          aria-label="Incompleto"
          data-incomplete="time"
          locale="pt-BR"
          referenceDateTime={REFERENCE}
        />
      </Scene>
      <Scene
        label="The day a short month did not hold"
        note="January 31 moving to February is 28, and moving again is March 31 — the requested day survives the month that could not hold it. No implementation surveyed does this."
      >
        <DateTimeField aria-label="January" defaultValue={END_OF_JANUARY} locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export const Clear: Story = {
  parameters: scenario('clear'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One button, both halves"
        note="There is no control that clears one side only: half a half is not a value this family holds. Focus returns to the first segment, so the reader starts over without looking for the mouse."
      >
        <DateTimeField
          aria-label="With value"
          clearable
          defaultValue={CONSULTATION}
          locale="pt-BR"
          messages={{ clear: 'Limpar' }}
        />
      </Scene>
      <Scene
        label="Only when there is something to clear"
        note="The button only appears with something written and with the control editable, so the frame does not reserve a space that is never used."
      >
        <DateTimeField aria-label="Empty" clearable locale="pt-BR" />
        <DateTimeField
          aria-label="Read-only"
          clearable
          defaultValue={CONSULTATION}
          locale="pt-BR"
          readOnly
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
        label="A mark and a zone"
        note="The two slots are named for reading direction and not for side, so the same markup puts the mark before the value in both directions. Any icon inside them is sized by the control's glyph scale."
      >
        <DateTimeField
          aria-label="Com marca"
          defaultValue={CONSULTATION}
          end={<span>UTC−3</span>}
          locale="pt-BR"
          start={
            <Icon>
              <CalendarClock aria-hidden />
            </Icon>
          }
        />
      </Scene>
      <Scene
        label="Where the picker puts the trigger"
        note="The end slot is exactly where datetime-picker puts its button, which is how the picker composes this family without redrawing any of it."
      >
        <DateTimeField
          aria-label="With action"
          clearable
          defaultValue={CONSULTATION}
          end={
            <Button size="sm" variant="ghost">
              Agora
            </Button>
          }
          locale="pt-BR"
        />
      </Scene>
    </Grid>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A real form row"
        note="The value reaches a form post as YYYY-MM-DDTHH:mm:ss, which is the format of input[type=datetime-local] itself — no adapter and nobody reading the control."
      >
        <Field>
          <FieldLabel>Appointment start</FieldLabel>
          <DateTimeField defaultValue={CONSULTATION} locale="pt-BR" name="start" required />
          <FieldDescription>Business hours: 9 AM to 6 PM.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="With error"
        note="The surrounding field supplies the label, the description and the error, and the control takes from it the size, the disabled state and the validity — unless it declares its own."
      >
        <Field invalid>
          <FieldLabel>Appointment start</FieldLabel>
          <DateTimeField
            defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(20, 0))}
            locale="pt-BR"
            name="start"
            {...CLINIC}
          />
          <FieldError>Choose a time within business hours.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A long day period"
        note="es-MX writes a. m. and p. m., and the box is sized by the wider of the two names the locale uses — not by two characters, which would cut the first."
      >
        <DateTimeField
          aria-label="Español"
          defaultValue={CONSULTATION}
          hourCycle={12}
          locale="es-MX"
        />
      </Scene>
      <Scene
        label="Right to left"
        note="Each half is its own bidirectional run, so the digits read left to right inside a mirrored page. The alternative was a capture that read 30:14 — a time nobody wrote."
      >
        <DateTimeField aria-label="العربية" defaultValue={CONSULTATION} locale="ar-EG" />
      </Scene>
      <Scene
        label="Seven fields and a numbering system of its own"
        note="The digits the locale writes are read back by the same parser that wrote them, at any granularity."
        layout="block"
      >
        <DateTimeField
          aria-label="日本語"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 45))}
          granularity="second"
          locale="ja-JP"
        />
      </Scene>
    </Grid>
  ),
};

function HandleDemo() {
  const handle = useRef<DateTimeFieldHandle | null>(null);

  return (
    <>
      <DateTimeField
        aria-label="Com handle"
        clearable
        defaultValue={CONSULTATION}
        locale="pt-BR"
        ref={handle}
      />
      <div className="slotted-demo-row">
        <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
          Focar
        </Button>
        <Button onClick={() => handle.current?.clear()} size="sm" variant="outline">
          Limpar
        </Button>
      </div>
    </>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One decision, once"
        note="The provider fixes the clock and the zone for everything below it, and the SlottedProvider the language and every label. A control that declares either still wins — it is the second row here."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <DateTimeFieldDefaultsProvider hourCycle={24} timeZone="America/Sao_Paulo">
            <DateTimeField aria-label="From the provider" clearable defaultValue={CONSULTATION} />
            <DateTimeField
              aria-label="With its own locale"
              defaultValue={CONSULTATION}
              locale="en-US"
            />
          </DateTimeFieldDefaultsProvider>
        </SlottedProvider>
      </Scene>
      <Scene
        label="The actions that are not declared"
        note="focus() puts the reader in the first segment and clear() empties both halves with the clear reason on the request. Nothing else: an escape hatch is for what does not fit in a prop."
      >
        <HandleDemo />
      </Scene>
      <Scene
        label="Replacing the element"
        note="render swaps the element the frame draws and receives the ref back — a replaced frame must return its element, because focus() reaches the segments through it."
      >
        <DateTimeField
          aria-label="Como section"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          render={(props) => <section {...props} />}
        />
      </Scene>
    </Grid>
  ),
};

function KeyboardDemo() {
  const [pressed, setPressed] = useState<string[]>([]);

  return (
    <>
      <DateTimeField
        aria-label="Teclado"
        defaultValue={CONSULTATION}
        locale="pt-BR"
        onKeyDown={(event) => setPressed((keys) => [event.key, ...keys].slice(0, 6))}
      />
      <p className="slotted-demo-scene__note">
        {pressed.length === 0
          ? 'Type in the field: each key passes first through its own handler.'
          : pressed.join(' · ')}
      </p>
    </>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The arrows cross the boundary"
        note="From the right of the year to the hour, and back — one line and not two. Two nested fields would both stop at the boundary, which is the third reason this family draws a single line."
      >
        <DateTimeField aria-label="Arrows" defaultValue={CONSULTATION} locale="pt-BR" />
      </Scene>
      <Scene
        label="The page steps"
        note="PageUp moves the year 10, the month 5, the day 5, the hour 3, the minute 15 and the second 15 — each half pages as its own family already pages. Home and End take the field to its minimum and its maximum."
      >
        <DateTimeField
          aria-label="Pages"
          defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 45))}
          granularity="second"
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="The consumer's handler runs first"
        note="The family composes with the handler instead of replacing it, and a key it acts on is stopped — not only defaulted — because a div with role=spinbutton is invisible to any shortcut guard."
      >
        <KeyboardDemo />
      </Scene>
    </Grid>
  ),
};
