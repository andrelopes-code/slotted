import { plainDate, plainDateTime, plainTime } from '@slotted/core/date';
import type { PlainDate, PlainTime } from '@slotted/core/date';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { SlottedProvider } from '../i18n';
import { DateTimePicker } from './datetime-picker';
import { DateTimePickerDefaultsProvider } from './datetime-picker-defaults';
import { Grid, Measure, Scene } from './datetime-picker-demo';
import { REACT_DATETIME_PICKER_DOCS, REACT_DATETIME_PICKER_TOKENS } from './datetime-picker.docs';
import type { DateTimePickerHandle } from './datetime-picker.types';

/** A consultation on a Thursday afternoon, and the clinic it belongs to. */
const CONSULTATION = plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20));
/** Stated rather than read from the clock, so every scene reads the same twice. */
const REFERENCE = plainDateTime(plainDate(2026, 9, 10), plainTime(14, 40));

const CLINIC = {
  max: plainDateTime(plainDate(2026, 12, 20), plainTime(12, 0)),
  maxTime: plainTime(18, 0),
  min: plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0)),
  minTime: plainTime(9, 0),
};

const isSaturday = (date: PlainDate) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 6;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_DATETIME_PICKER_DOCS.dateTimePicker.scenes, {
    playground: Playground,
    panel: Panel,
    'open-to': OpenTo,
    completeness: Completeness,
    seconds: Seconds,
    step: Step,
    'range-bounds': RangeBounds,
    'day-window': DayWindow,
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
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'DateTime Picker',
        description:
          'The only family in the library that holds two surfaces at once: a month and a list of times, inside one dialog, over a field that still types every segment. The decision it owes is which of the two focus opens on — and what happens to the other when the reader finishes the first. The answer is the value’s own completeness: the press that leaves it half written carries focus to the missing half, and the press that finishes it closes the panel. No confirmation button, and none declined by accident.',
        framework: 'React',
        ...REACT_DATETIME_PICKER_DOCS.dateTimePicker,
        tokens: REACT_DATETIME_PICKER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every open panel needs room under it, and the stage is what gives it. This
 * one holds a month and a column of times, so it is a screen rather than the
 * tall box a single listbox needs.
 */
const Stage = ({ children }: { children: ReactNode }) => (
  <div className="slotted-demo-viewport" data-size="screen">
    {children}
  </div>
);

export const Playground: Story = {
  args: {
    clearable: true,
    closeOnSelect: 'auto',
    granularity: 'minute',
    locale: 'pt-BR',
    openTo: 'date',
    placement: 'bottom-start',
    size: 'md',
    step: 900,
    variant: 'outline',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field>
        <FieldLabel>Appointment start</FieldLabel>
        <DateTimePicker {...args} name="start" referenceDateTime={REFERENCE} />
        <FieldDescription>Choose in the panel or type in the field.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One dialog, two surfaces"
        note="A grid the calendar draws and a listbox this family draws, side by side inside the same role=dialog. Both are in the DOM at any width: a tablist that exists in a narrow container and not in a wide one tells assistive technology two different stories about the same component."
      >
        <Stage>
          <DateTimePicker
            aria-label="Start"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={1800}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const OpenTo: Story = {
  parameters: scenario('open-to'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Focus opens on the date"
        note="The default, and the order in which the value itself reads. The reader arrives at the value's day, with the calendar's roving focus already in place."
      >
        <Stage>
          <DateTimePicker
            aria-label="Abre na data"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            openTo="date"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
      <Scene
        label="Focus opens on the time"
        note="For a schedule whose day is already decided. openTo decides the focus and not the drawing: both surfaces stay present, because moving a whole month because of a setting would make the same family look like two."
      >
        <Stage>
          <DateTimePicker
            aria-label="Abre na hora"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            openTo="time"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Completeness: Story = {
  parameters: scenario('completeness'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Half written: focus goes to the one that is missing"
        note="A day chosen over an empty field leaves the value unfinished, and the panel stays — with focus already in the list. The band at the top says what the reader has so far, and draws the missing half as --:--."
      >
        <Stage>
          <DateTimePicker
            aria-label="Por acabar"
            closeOnSelect="auto"
            defaultOpen
            locale="pt-BR"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
      <Scene
        label="Whole value: the panel closes"
        note="The press that completes the value closes the panel and returns focus to the trigger, whose accessible name carries what was chosen. This is why this family needs neither Ant's needConfirm nor Kendo's Set."
      >
        <Stage>
          <DateTimePicker
            aria-label="Fecha ao completar"
            closeOnSelect="auto"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
      <Scene
        label="always"
        note="Any press that changes the value closes the panel, even when it was already whole. For a flow where switching day is a decision and not an exploration."
      >
        <DateTimePicker
          aria-label="Sempre"
          closeOnSelect="always"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          referenceDateTime={REFERENCE}
        />
      </Scene>
      <Scene
        label="never"
        note="The panel only closes by Escape, by a press outside it or by the trigger. For a panel embedded in a form that confirms elsewhere — the footer slot exists for that."
      >
        <DateTimePicker
          aria-label="Nunca"
          closeOnSelect="never"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          referenceDateTime={REFERENCE}
        />
      </Scene>
    </Grid>
  ),
};

export const Seconds: Story = {
  parameters: scenario('seconds'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Half a minute inside a window"
        note="The field writes every second and the list offers a 30-second step — eleven rows inside a bounded window, and not the 86,400 that a whole day would be. The guard is on the length of the list, maxOptions, and never on the size of the step."
      >
        <Stage>
          <DateTimePicker
            aria-label="Segundos"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(15, 20, 30))}
            granularity="second"
            locale="pt-BR"
            maxTime={plainTime(15, 25)}
            minTime={plainTime(15, 20)}
            referenceDateTime={REFERENCE}
            step={30}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Step: Story = {
  parameters: scenario('step'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Counted from the lower bound"
        note="min at 09:07 with a fifteen-minute step offers 09:07, 09:22, 09:37 — the platform's own rule for input[type=time], which no surveyed panel states. Open it and read the first three rows."
      >
        <Stage>
          <DateTimePicker
            aria-label="Base"
            defaultOpen
            locale="pt-BR"
            max={plainDateTime(plainDate(2026, 9, 12), plainTime(11, 0))}
            min={plainDateTime(plainDate(2026, 9, 10), plainTime(9, 7))}
            referenceDateTime={REFERENCE}
            step={900}
          />
        </Stage>
      </Scene>
      <Scene
        label="Times that no step describes"
        note="09:00, 09:20, 11:40, 13:45, 16:00. options states them in the consumer's order, and the field beside it still accepts any time between two rows."
      >
        <Stage>
          <DateTimePicker
            aria-label="Clinic hours"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 10), plainTime(11, 40))}
            locale="pt-BR"
            options={[
              plainTime(9, 0),
              plainTime(9, 20),
              plainTime(11, 40),
              plainTime(13, 45),
              plainTime(16, 0),
            ]}
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const RangeBounds: Story = {
  parameters: scenario('range-bounds'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The first day is partial"
        note="On the day of min itself the list starts at min and not at minTime: September 11 opens at 14:00 and not at 09:00. Both pairs hold at the same time, and this is the combination that MUI's validation page records failing to deliver."
      >
        <Stage>
          <DateTimePicker
            aria-label="First day"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 11), plainTime(14, 0))}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={3600}
            {...CLINIC}
          />
        </Stage>
      </Scene>
      <Scene
        label="A middle day runs the whole window"
        note="September 15 runs from 09:00 to 18:00 — the window that repeats every day inside the range. The day of max runs until 12:00 and stops there, and neither bound needs to be rewritten per day."
      >
        <Stage>
          <DateTimePicker
            aria-label="Dia do meio"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(10, 0))}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={3600}
            {...CLINIC}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const DayWindow: Story = {
  parameters: scenario('day-window'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Saturday closes at 13:00"
        note="The list answers for the day where the reader is, not the day already chosen. Walk the month with the arrows and the column recalculates under the cursor. Ant's disabledTime(date) is only called for an already confirmed date, and cannot say this."
      >
        <Stage>
          <DateTimePicker
            aria-label="Saturday"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 12), plainTime(10, 0))}
            isTimeUnavailable={(time: PlainTime, date: PlainDate) =>
              isSaturday(date) && time.hour >= 13
            }
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={3600}
          />
        </Stage>
      </Scene>
      <Scene
        label="A day with no time at all"
        note="A sentence instead of an empty box. MUI draws nothing here and Ant draws an empty column, and both read as a broken component."
      >
        <Stage>
          <DateTimePicker
            aria-label="Closed day"
            defaultOpen
            defaultValue={plainDateTime(plainDate(2026, 9, 12), plainTime(10, 0))}
            isTimeUnavailable={(_time: PlainTime, date: PlainDate) => isSaturday(date)}
            locale="pt-BR"
            messages={{ empty: 'There is no time available on this day.' }}
            referenceDateTime={REFERENCE}
            step={3600}
            unavailableOptions="hide"
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Unavailable: Story = {
  parameters: scenario('unavailable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Disable: the default"
        note="Lunch hour stays in the list, refused and legible. A list that silently erases rows is a list whose step the reader cannot infer."
      >
        <Stage>
          <DateTimePicker
            aria-label="Lunch disabled"
            defaultOpen
            defaultValue={CONSULTATION}
            isTimeUnavailable={(time: PlainTime) => time.hour === 12}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={1800}
            unavailableOptions="disable"
          />
        </Stage>
      </Scene>
      <Scene
        label="Hide: the consumer's choice"
        note="For a schedule with dozens of refused rows, where the noise costs more than the step. A whole day with no hours still gets the sentence and not an empty column."
      >
        <Stage>
          <DateTimePicker
            aria-label="Lunch hidden"
            defaultOpen
            defaultValue={CONSULTATION}
            isTimeUnavailable={(time: PlainTime) => time.hour === 12}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            step={1800}
            unavailableOptions="hide"
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Now: Story = {
  parameters: scenario('now'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="One press, both halves"
        note="Now writes the date and the time at once, and is the zero case of the field's own relative expression — drawn as a labeled control, for the reader who never discovers that + opens one. It loads the clock, which is the second of the family's two marks."
      >
        <Stage>
          <DateTimePicker
            aria-label="Agora"
            defaultOpen
            locale="pt-BR"
            messages={{ now: 'Agora' }}
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Relative: Story = {
  parameters: scenario('relative'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Typing with the panel open"
        note="Alt+Down arrow opens the panel and leaves focus in the field, so every key the segments had keeps working — including +, which opens the duration expression. Escape is staged: it leaves the expression first, and the panel stays."
      >
        <Stage>
          <DateTimePicker
            aria-label="Expression"
            defaultOpen
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            relative
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Presets: Story = {
  parameters: scenario('presets'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The consumer's shortcuts"
        note="They sit in the top band, beside Now, and wrap inside the panel's width instead of stretching it: the band is drawn at the panel's width and contributes nothing to it. This family ships no list of its own — «tomorrow at nine» is a business clock, and guessing it would be guessing an industry."
      >
        <Stage>
          <DateTimePicker
            aria-label="Com atalhos"
            defaultOpen
            locale="pt-BR"
            presets={
              <>
                <Button size="sm" variant="ghost">
                  Tomorrow 09:00
                </Button>
                <Button size="sm" variant="ghost">
                  Segunda 14:00
                </Button>
              </>
            }
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The control's three steps"
        note="Type, height and inner padding, and the trigger's box follows each. A picker inside a field takes the field's step."
      >
        <DateTimePicker aria-label="sm" defaultValue={CONSULTATION} locale="pt-BR" size="sm" />
        <DateTimePicker aria-label="md" defaultValue={CONSULTATION} locale="pt-BR" size="md" />
        <DateTimePicker aria-label="lg" defaultValue={CONSULTATION} locale="pt-BR" size="lg" />
      </Scene>
      <Scene
        label="The panel follows the step"
        note="The list rows and the column's ceiling go down together, so a dense panel does not end up with eleven rows of one height and the same number of visible rows."
      >
        <Stage>
          <DateTimePicker
            aria-label="Small panel"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
            size="sm"
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="outline and subtle"
        note="The frame is the field's, so a form with a name and a datetime shows the same frame twice. subtle swaps the border for a surface."
      >
        <DateTimePicker
          aria-label="outline"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          variant="outline"
        />
        <DateTimePicker
          aria-label="subtle"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          variant="subtle"
        />
      </Scene>
      <Scene
        label="plain"
        note="Nothing until used, which is what a dense table of bookings needs. Focus and hover are still drawn, because an invisible control that does not respond is not a control."
      >
        <DateTimePicker
          aria-label="plain"
          defaultValue={CONSULTATION}
          locale="pt-BR"
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
        label="Below, aligned to the start"
        note="The default. The layer arrives along the axis it opens on and never along the inline axis, and data-placement says what the positioner resolved."
      >
        <Stage>
          <DateTimePicker
            aria-label="Em baixo"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            placement="bottom-start"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
      <Scene
        label="A preference the positioner flips"
        note="Here the control asks for top-start and has no room above it inside this box, so the layer resolves below and data-placement says bottom-start. The preference is a request and not a guarantee, and it is the same thing that happens to a control at the top of a page."
      >
        <Stage>
          <DateTimePicker
            aria-label="Em cima"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            placement="top-start"
            referenceDateTime={REFERENCE}
          />
        </Stage>
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
        note="Read-only stays focusable and copyable and never looks like disabled; the trigger stays, and does not open. Disabled responds to neither key nor pointer, and the trigger is a disabled button."
      >
        <DateTimePicker
          aria-label="Read-only"
          defaultValue={CONSULTATION}
          locale="pt-BR"
          readOnly
        />
        <DateTimePicker
          aria-label="Desactivado"
          clearable
          defaultValue={CONSULTATION}
          disabled
          locale="pt-BR"
        />
      </Scene>
      <Scene
        label="Required and invalid"
        note="Required reaches the field's group as aria-required. Invalid keeps the focus ring and changes its color — and stays invalid when the value falls outside either of the two pairs of bounds, whatever the consumer says."
      >
        <DateTimePicker aria-label="Required" defaultValue={CONSULTATION} locale="pt-BR" required />
        <DateTimePicker aria-label="Invalid" defaultValue={CONSULTATION} invalid locale="pt-BR" />
      </Scene>
      <Scene
        label="Chosen, current and pointed at"
        note="In the list, the chosen row beats the highlight, the highlight beats the pointer, and each weaker rule is guarded by specificity and not by order of writing. The current hour of the day carries a discreet mark that competes with neither of the other two."
        span="full"
      >
        <Stage>
          <DateTimePicker
            aria-label="Estados da lista"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            openTo="time"
            referenceDateTime={REFERENCE}
            step={1800}
          />
        </Stage>
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
        note="The value reaches a form post as YYYY-MM-DDTHH:mm:ss, through the field's own hidden input — no adapter and nobody reading the control."
      >
        <Field>
          <FieldLabel>Appointment start</FieldLabel>
          <DateTimePicker
            defaultValue={CONSULTATION}
            locale="pt-BR"
            name="start"
            referenceDateTime={REFERENCE}
            required
          />
          <FieldDescription>Business hours: 9 AM to 6 PM.</FieldDescription>
        </Field>
      </Scene>
      <Scene
        label="With error"
        note="The surrounding field supplies the label, the description and the error, and the control takes from it the size, the disabled state and the validity — unless it declares its own."
      >
        <Field invalid>
          <FieldLabel>Appointment start</FieldLabel>
          <DateTimePicker
            defaultValue={plainDateTime(plainDate(2026, 9, 15), plainTime(20, 0))}
            locale="pt-BR"
            name="start"
            referenceDateTime={REFERENCE}
            {...CLINIC}
          />
          <FieldError>Choose a time within business hours.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The control under 320 pixels"
        note="The row of seven fields breaks between the two halves and never inside one, and the trigger stays where it was: at the end of the field, on the reading side."
      >
        <Measure>
          <DateTimePicker aria-label="Estreito" defaultValue={CONSULTATION} locale="pt-BR" />
        </Measure>
      </Scene>
      <Scene
        label="The panel in a column"
        note="The two surfaces break in the order of the value itself, with nothing hidden and no switch drawn. The hours column takes the whole row where it falls, so it reads as a section and not as a strip — a single flex rule answers both arrangements."
      >
        <div className="slotted-demo-viewport" data-size="screen">
          <Measure>
            <DateTimePicker
              aria-label="Narrow panel"
              defaultOpen
              defaultValue={CONSULTATION}
              locale="pt-BR"
              referenceDateTime={REFERENCE}
            />
          </Measure>
        </div>
      </Scene>
    </Grid>
  ),
};

function HandleDemo() {
  const handle = useRef<DateTimePickerHandle | null>(null);

  return (
    <>
      <DateTimePicker
        aria-label="Com handle"
        clearable
        defaultValue={CONSULTATION}
        locale="pt-BR"
        ref={handle}
        referenceDateTime={REFERENCE}
      />
      <div className="slotted-demo-row">
        <Button onClick={() => handle.current?.focus()} size="sm" variant="outline">
          Focar
        </Button>
        <Button onClick={() => handle.current?.open()} size="sm" variant="outline">
          Open
        </Button>
        <Button onClick={() => handle.current?.close()} size="sm" variant="outline">
          Close
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
        note="The provider fixes the clock, the step and the placement for everything below it, and the SlottedProvider the language and every label. A control that declares either still wins — it is the second row here."
      >
        <SlottedProvider catalogs={{ 'pt-BR': PT_BR }} locale="pt-BR">
          <DateTimePickerDefaultsProvider step={1800}>
            <DateTimePicker aria-label="From the provider" defaultValue={CONSULTATION} />
            <DateTimePicker aria-label="With its own step" defaultValue={CONSULTATION} step={900} />
          </DateTimePickerDefaultsProvider>
        </SlottedProvider>
      </Scene>
      <Scene
        label="A row drawn by the consumer"
        note="renderOption draws what is inside the row; the row stays the family's — the role, the states, the keyboard and the touch target. Here, how many openings remain beside the time."
      >
        <Stage>
          <DateTimePicker
            aria-label="Own row"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            openTo="time"
            referenceDateTime={REFERENCE}
            renderOption={({ label, time }) => (
              <>
                <span>{label}</span>
                <span>{time.hour % 3} vagas</span>
              </>
            )}
            step={1800}
          />
        </Stage>
      </Scene>
      <Scene
        label="The actions that are not declared"
        note="focus() puts the reader in the field's first segment, and open() and close() move the panel without a press. Nothing else: an escape hatch is for what does not fit in a prop."
      >
        <HandleDemo />
      </Scene>
      <Scene
        label="A consumer footer"
        note="The family needs none — the completeness of the value closes the panel — and the slot is here for a flow that does want a deliberate confirmation."
      >
        <Stage>
          <DateTimePicker
            aria-label="With footer"
            closeOnSelect="never"
            defaultOpen
            defaultValue={CONSULTATION}
            footer={
              <Button size="sm" variant="solid">
                Confirmar
              </Button>
            }
            locale="pt-BR"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
    </Grid>
  ),
};

function KeyboardDemo() {
  const [pressed, setPressed] = useState<string[]>([]);

  return (
    <>
      <DateTimePicker
        aria-label="Teclado"
        defaultValue={CONSULTATION}
        locale="pt-BR"
        onKeyDown={(event) => setPressed((keys) => [event.key, ...keys].slice(0, 6))}
        referenceDateTime={REFERENCE}
      />
      <p className="slotted-demo-scene__note">
        {pressed.length === 0
          ? 'Type in the field or open the panel: each key passes first through its own handler.'
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
        label="Two Tab stops, not forty-three"
        note="Only one grid element is in the Tab sequence, as the grid pattern requires, and the listbox is one stop for the same reason. With the panel open, Tab stays contained inside the layer."
      >
        <Stage>
          <DateTimePicker
            aria-label="Tab"
            defaultOpen
            defaultValue={CONSULTATION}
            locale="pt-BR"
            referenceDateTime={REFERENCE}
          />
        </Stage>
      </Scene>
      <Scene
        label="The consumer's handler runs first"
        note="The family composes with the handler instead of replacing it, on the control, on the trigger and on the list. Alt+Down arrow opens the panel from a segment; from the trigger, Down arrow opens it and takes focus to the surface that openTo names."
      >
        <KeyboardDemo />
      </Scene>
    </Grid>
  ),
};
