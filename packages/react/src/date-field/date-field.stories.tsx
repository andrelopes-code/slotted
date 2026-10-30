import { plainDate } from '@slotted/core/date';
import type { PlainDate, SegmentState } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { Icon } from '../icon';
import { DateField } from './date-field';
import { DateFieldDefaultsProvider } from './date-field-defaults';
import { Grid, Measure, Scene } from './date-field-demo';
import { REACT_DATE_FIELD_DOCS, REACT_DATE_FIELD_TOKENS } from './date-field.docs';
import type { DateFieldHandle } from './date-field.types';

const NINTH = plainDate(2026, 9, 9);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATE_FIELD_DOCS.dateField.scenes, {
    playground: Playground,
    locale: Locale,
    sizes: Sizes,
    variants: Variants,
    range: Range,
    states: States,
    clear: Clear,
    adornments: Adornments,
    forms: Forms,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/DateField',
  component: DateField,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Date Field',
        description:
          'A date typed one field at a time, in the order the reader’s own locale writes it. Each field is a spin button; the three together are one group whose name is the whole date; and the value reaches a form as an ISO string without anything reading the control.',
        framework: 'React',
        ...REACT_DATE_FIELD_DOCS.dateField,
        tokens: REACT_DATE_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    clearable: true,
    locale: 'pt-BR',
    size: 'md',
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <DateField {...args} name="due-date" />
        <FieldDescription>The invoice is due on this date.</FieldDescription>
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
        note="Day, month and year, separated by slash, with an empty dd/mm/aaaa — all three coming from Intl."
      >
        <DateField aria-label="Date" defaultValue={NINTH} locale="pt-BR" />
        <DateField aria-label="Data vazia" locale="pt-BR" />
      </Scene>
      <Scene
        label="en-US"
        note="The same component, month first, because that is what the locale writes and nobody wrote a format string."
      >
        <DateField aria-label="Date" defaultValue={NINTH} locale="en-US" />
        <DateField aria-label="Empty date" locale="en-US" />
      </Scene>
      <Scene
        label="de-DE"
        note="Full stops rather than slashes, and a placeholder that reads tt.mm.jjjj because Tag, Monat and Jahr are the words."
      >
        <DateField aria-label="Datum" defaultValue={NINTH} locale="de-DE" />
        <DateField aria-label="Leeres Datum" locale="de-DE" />
      </Scene>
      <Scene
        label="ja-JP"
        note="The year comes first, and the placeholder is the ideograph rather than four repeats of it — a name one character long is used whole."
      >
        <DateField aria-label="日付" defaultValue={NINTH} locale="ja-JP" />
        <DateField aria-label="空の日付" locale="ja-JP" />
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
        note="Three steps of type, height and inside padding, all from the control scales the theme restates per density."
      >
        <DateField aria-label="Small" defaultValue={NINTH} locale="pt-BR" size="sm" />
        <DateField aria-label="Default" defaultValue={NINTH} locale="pt-BR" size="md" />
        <DateField aria-label="Large" defaultValue={NINTH} locale="pt-BR" size="lg" />
      </Scene>
      <Scene
        label="Inside a field"
        note="The control takes the field’s step rather than its own default: a small field holding a medium control is one row disagreeing with itself."
      >
        <Field size="sm">
          <FieldLabel>Vencimento</FieldLabel>
          <DateField defaultValue={NINTH} locale="pt-BR" />
        </Field>
        <Field size="lg">
          <FieldLabel>Issue date</FieldLabel>
          <DateField defaultValue={NINTH} locale="pt-BR" />
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
        label="outline"
        note="The default. It takes the ground it is placed on, so a form inside a card and the same form on the page both read correctly."
      >
        <DateField aria-label="Contorno" defaultValue={NINTH} locale="pt-BR" variant="outline" />
      </Scene>
      <Scene
        label="subtle"
        note="Sinks into the page. Right where a form is a block of many fields and the frames would otherwise be the loudest thing on it."
      >
        <DateField aria-label="Discreto" defaultValue={NINTH} locale="pt-BR" variant="subtle" />
      </Scene>
      <Scene
        label="plain"
        note="Nothing at rest, and the same box while it is used, so a table row does not reflow when the pointer crosses it."
      >
        <DateField aria-label="Simples" defaultValue={NINTH} locale="pt-BR" variant="plain" />
      </Scene>
      <Scene
        label="In a dense row"
        note="plain in the place it exists for: a cell that is only a control while somebody is in it."
      >
        <DateField
          aria-label="Cell"
          defaultValue={NINTH}
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
        label="Inside the bounds"
        note="A date the rules accept. min and max reach every segment as aria-valuemin and aria-valuemax, so a screen reader hears the range."
      >
        <DateField
          aria-label="Dentro"
          defaultValue={NINTH}
          locale="pt-BR"
          max={plainDate(2026, 12, 31)}
          min={plainDate(2026, 1, 1)}
        />
      </Scene>
      <Scene
        label="Outside them"
        note="The same rules with a value from 2025. The control states its own invalidity: nothing outside it knows the bounds."
      >
        <Field>
          <FieldLabel>Vencimento</FieldLabel>
          <DateField
            defaultValue={plainDate(2025, 12, 31)}
            locale="pt-BR"
            max={plainDate(2026, 12, 31)}
            min={plainDate(2026, 1, 1)}
          />
          <FieldError>Escolha uma data de 2026.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="A day that is refused"
        note="isDateUnavailable takes a predicate rather than a list, so a weekend, a holiday and a booked day are all the same one line."
      >
        <Field>
          <FieldLabel>Delivery</FieldLabel>
          <DateField
            defaultValue={plainDate(2026, 12, 25)}
            isDateUnavailable={(date) => date.month === 12 && date.day === 25}
            locale="pt-BR"
          />
          <FieldError>We do not deliver on Christmas.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="A birth date"
        note="yearPivot at 0 sends every two-digit year that would land ahead of this one into the last century, so typing 80 is 1980 and not 2080."
      >
        <DateField aria-label="Nascimento" locale="pt-BR" yearPivot={0} />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Read-only"
        note="Still focusable, still selectable, still submitted. The ground says it is not yours to change and the ink says nothing at all — it must not read as disabled."
      >
        <DateField aria-label="Somente leitura" defaultValue={NINTH} locale="pt-BR" readOnly />
      </Scene>
      <Scene
        label="Disabled"
        note="No key, no pointer, no tab stop, and the value still legible: a disabled form still has to say what it holds."
      >
        <DateField aria-label="Desativado" defaultValue={NINTH} disabled locale="pt-BR" />
      </Scene>
      <Scene
        label="Invalid"
        note="Tab into it: the ring is retargeted to the danger color rather than removed, because a focus indicator is a focus indicator before it is an error."
      >
        <Field invalid>
          <FieldLabel>Due date</FieldLabel>
          <DateField defaultValue={plainDate(2026, 2, 28)} locale="pt-BR" />
          <FieldError>This date has passed.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Required"
        note="The field draws the mark and the group carries aria-required, so the necessity is both seen and heard."
      >
        <Field required>
          <FieldLabel>Vencimento</FieldLabel>
          <DateField locale="pt-BR" />
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
        label="With something to clear"
        note="The button is drawn because a segment holds a value. Press it: every field empties and focus lands on the first rather than nowhere."
      >
        <DateField aria-label="With value" clearable defaultValue={NINTH} locale="pt-BR" />
      </Scene>
      <Scene
        label="With nothing to clear"
        note="The same control with an empty value. The button is withdrawn rather than disabled: a disabled button is one more thing to tab past."
      >
        <DateField aria-label="Vazio" clearable locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};

export const Adornments: Story = {
  parameters: scenario('adornments'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A mark before the date"
        note="Any icon in the slot is sized from the control’s own glyph scale, so a small control in a dense table draws a smaller mark with nothing written per instance."
      >
        <DateField
          aria-label="With icon"
          defaultValue={NINTH}
          locale="pt-BR"
          start={
            <Icon>
              <CalendarDays />
            </Icon>
          }
        />
      </Scene>
      <Scene
        label="A note after it"
        note="The end slot is quieter than the value: an adornment annotates, and a reader looking for the date should not have to step over it."
      >
        <DateField aria-label="Com fuso" defaultValue={NINTH} end="UTC−3" locale="pt-BR" />
      </Scene>
      <Scene
        label="Both, with a clear button"
        note="The three inner controls share one frame and one border, and the glyph ends the same distance from the edge as the digits begin from it."
      >
        <DateField
          aria-label="Completo"
          clearable
          defaultValue={NINTH}
          end="UTC−3"
          locale="pt-BR"
          start={
            <Icon>
              <CalendarDays />
            </Icon>
          }
        />
      </Scene>
      <Scene
        label="In a narrow column"
        note="Below 320 pixels the frame holds and the date keeps its columns, because a segment’s width is stated in digits rather than measured from its content."
      >
        <Measure>
          <DateField aria-label="Estreito" clearable defaultValue={NINTH} locale="pt-BR" />
        </Measure>
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
          note="Submit it: the hidden input sends the value as 2026-09-09 under the name, with no JavaScript reading the control and no adapter between."
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setPosted(String(data.get('vencimento') ?? ''));
            }}
          >
            <Field>
              <FieldLabel>Vencimento</FieldLabel>
              <DateField defaultValue={NINTH} locale="pt-BR" name="vencimento" required />
              <FieldDescription>
                {posted === null ? 'Not sent yet.' : `Sent: ${posted}`}
              </FieldDescription>
            </Field>
            <Button type="submit">Save</Button>
          </form>
        </Scene>
      </Grid>
    );
  },
};

export const Content: Story = {
  parameters: scenario('content'),
  render: function ContentStory() {
    const [segments, setSegments] = useState<SegmentState | null>(null);
    const [value, setValue] = useState<PlainDate | null>(null);

    return (
      <Grid columns={1}>
        <Scene
          label="A date halfway through"
          note="Type a day and a month and stop. The value stays null and the segments say what is already there — the state every surveyed implementation collapses into an empty one."
        >
          <Field>
            <FieldLabel>Nascimento</FieldLabel>
            <DateField
              locale="pt-BR"
              onValueChange={(next, request) => {
                setValue(next);
                setSegments(request.segments);
              }}
            />
            <FieldDescription>
              {`valor: ${value === null ? 'null' : `${value.year}-${value.month}-${value.day}`} · `}
              {`segmentos: ${segments === null ? '—' : `${String(segments.day)}/${String(segments.month)}/${String(segments.year)}`}`}
            </FieldDescription>
          </Field>
        </Scene>
      </Grid>
    );
  },
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const handle = useRef<DateFieldHandle | null>(null);

    return (
      <Grid columns={2}>
        <Scene
          label="Set once for the application"
          note="The provider decides the zone and the appearance for everything under it, and SlottedProvider the language that writes the date and names the clear button."
        >
          <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
            <DateFieldDefaultsProvider timeZone="America/Sao_Paulo" variant="subtle">
              <DateField aria-label="Inherited" clearable defaultValue={NINTH} />
              <DateField aria-label="Also inherited" />
            </DateFieldDefaultsProvider>
          </SlottedProvider>
        </Scene>
        <Scene
          label="One control outranks it"
          note="An explicit prop always wins over the language in force, so a single Japanese date inside a Brazilian application needs one attribute and no second provider."
        >
          <SlottedProvider locale="pt-BR">
            <DateField aria-label="日付" defaultValue={NINTH} locale="ja-JP" />
          </SlottedProvider>
        </Scene>
        <Scene
          label="The imperative handle"
          note="focus() and clear() are the two actions no prop can express. Press the buttons: one puts the reader on the first field, the other empties the value with the clear reason."
          layout="stack"
        >
          <DateField aria-label="Controlado" defaultValue={NINTH} locale="pt-BR" ref={handle} />
          <Button onClick={() => handle.current?.focus()} variant="outline">
            focus()
          </Button>
          <Button onClick={() => handle.current?.clear()} variant="outline">
            clear()
          </Button>
        </Scene>
        <Scene
          label="A substituted element"
          note="render replaces the frame’s element and keeps everything on it, including the ref the family needs to reach its own segments."
        >
          <DateField
            aria-label="Overridden"
            defaultValue={NINTH}
            locale="pt-BR"
            render={(props) => <section {...props} />}
          />
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Stepping wraps inside a field"
        note="Put focus on the month and press ArrowUp from December: it becomes January and the year does not move. One press changes one field."
      >
        <DateField aria-label="Dezembro" defaultValue={plainDate(2026, 12, 9)} locale="pt-BR" />
      </Scene>
      <Scene
        label="The day a short month could not hold"
        note="From 31 January, press ArrowUp on the month twice. February shows 28 and March shows 31 again — the 31 is remembered rather than thrown away."
      >
        <DateField aria-label="Trinta e um" defaultValue={plainDate(2026, 1, 31)} locale="pt-BR" />
      </Scene>
      <Scene
        label="Typing moves on when a field is full"
        note="Type 3 into the month and focus goes on, because 30 is not a month. Type 3 into the day and it waits, because 30 and 31 are both still reachable."
      >
        <DateField aria-label="Typing" locale="pt-BR" />
      </Scene>
      <Scene
        label="Pasting a whole date"
        note="Paste 09/09/2026 or 2026-09-09 into it. The locale’s own shape is read first, so 12/03 is March here and December to an American reader."
      >
        <DateField aria-label="Colagem" locale="pt-BR" />
      </Scene>
    </Grid>
  ),
};
