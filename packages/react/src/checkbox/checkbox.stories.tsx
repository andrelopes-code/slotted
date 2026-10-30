import {
  bindScenes,
  createReferencePage,
  scenario,
  WorkbenchMatrix,
} from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { CheckboxGroup } from '../checkbox-group';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Grid as LayoutGrid } from '../grid';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { Radio, RadioGroup } from '../radio-group';
import { Text } from '../typography';
import { Checkbox } from './checkbox';
import { CheckboxDefaultsProvider } from './checkbox-defaults';
import { REACT_CHECKBOX_DOCS, REACT_CHECKBOX_TOKENS } from './checkbox.docs';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Sexta',
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CHECKBOX_DOCS.checkbox.scenes, {
    playground: Playground,
    sizes: Sizes,
    tile: Tile,
    states: States,
    indeterminate: Indeterminate,
    placement: Placement,
    description: Description,
    field: InsideAField,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Checkbox',
        description:
          'One choice, ticked or not, around a native input that keeps the value, the name and the platform’s whole keyboard — with the mark drawn as a mask beside it rather than as a character inside it.',
        framework: 'React',
        ...REACT_CHECKBOX_DOCS.checkbox,
        tokens: REACT_CHECKBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    children: 'Send receipt',
    defaultChecked: true,
    description: 'We will send the receipt by email.',
    disabled: false,
    indeterminate: false,
    labelPlacement: 'end',
    readOnly: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Checkbox {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        note="The square, the type and the gap all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts."
        layout="stack"
      >
        <Checkbox defaultChecked size="sm">
          Compacto
        </Checkbox>
        <Checkbox defaultChecked size="md">
          Default
        </Checkbox>
        <Checkbox defaultChecked size="lg">
          Comfortable
        </Checkbox>
      </Scene>
      <Scene
        label="Inside a group, the group decides"
        note="A small group holding a medium box is a group and a control disagreeing about one row, so the box reads the group’s step before its own provider’s."
        layout="stack"
      >
        <CheckboxGroup defaultValue={['a']} size="sm">
          <Checkbox value="a">Compact because the group is</Checkbox>
          <Checkbox value="b">And this one too</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup defaultValue={['a']} size="lg">
          <Checkbox value="a">Comfortable because the group is</Checkbox>
        </CheckboxGroup>
      </Scene>
    </Grid>
  ),
};

export const Tile: Story = {
  parameters: scenario('tile'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The whole frame is the target"
        note="Click the description, the empty space, the edge — the label’s hit area covers the surface, so a tile is one target rather than a box with text beside it."
        layout="block"
      >
        <LayoutGrid gap={4} minItemWidth="sm">
          <Checkbox
            defaultChecked
            description="One copy per day, kept for thirty days."
            variant="tile"
          >
            Daily backup
          </Checkbox>
          <Checkbox description="Who changed what, and when, exportable as CSV." variant="tile">
            Audit log
          </Checkbox>
          <Checkbox description="Available from the Scale plan." disabled variant="tile">
            Secondary region
          </Checkbox>
        </LayoutGrid>
      </Scene>
      <Scene
        label="Chosen is an edge before it is a tint"
        note="Switch the toolbar to high contrast: the tint flattens to white and the two-pixel accent edge is what still says which tile was chosen. Hovering a chosen tile deepens that edge rather than its ground, because the tint is already the last step the tone has."
        layout="block"
      >
        <LayoutGrid columns={1} gap={4}>
          <Checkbox defaultChecked variant="tile">
            Chosen
          </Checkbox>
          <Checkbox variant="tile">Not chosen</Checkbox>
          <Checkbox defaultChecked invalid variant="tile">
            Chosen and invalid
          </Checkbox>
          <Checkbox defaultChecked readOnly variant="tile">
            Escolhido e somente leitura
          </Checkbox>
        </LayoutGrid>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="What a reader may still change"
        note="Hover the first two and press one: the ground answers the pointer and goes one step further under it, and the ring on focus sits clear of the border rather than on it."
        layout="stack"
      >
        <Checkbox>Default</Checkbox>
        <Checkbox defaultChecked>Checked</Checkbox>
        <Checkbox indeterminate>Partially checked</Checkbox>
      </Scene>
      <Scene
        label="What a reader may not"
        note="Read-only keeps full-strength ink, its ring and its tab stop, because the value is real and still submitted. Disabled loses all three, and stays legible rather than merely faded."
        layout="stack"
      >
        <Checkbox defaultChecked readOnly>
          Somente leitura
        </Checkbox>
        <Checkbox disabled>Desativado</Checkbox>
        <Checkbox defaultChecked disabled>
          Desativado e marcado
        </Checkbox>
      </Scene>
      <Scene
        label="Invalid says it twice"
        note="The border reddens and thickens together, because the high-contrast scheme paints every border the same black and colour alone would leave the two states identical there."
        layout="stack"
      >
        <Checkbox invalid>Choose at least one</Checkbox>
        <Checkbox defaultChecked invalid>
          Invalid and checked
        </Checkbox>
      </Scene>
    </Grid>
  ),
};

export const Indeterminate: Story = {
  parameters: scenario('indeterminate'),
  render: () => {
    function Permissions() {
      const [value, setValue] = useState<readonly string[]>(['mon', 'tue']);
      return (
        <CheckboxGroup allValues={[...DAYS]} onValueChange={setValue} value={value}>
          <Checkbox parent>Every weekday</Checkbox>
          {DAYS.map((day) => (
            <Checkbox key={day} value={day}>
              {DAY_LABELS[day]}
            </Checkbox>
          ))}
        </CheckboxGroup>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="A state the consumer owns"
          note="The dash is drawn from the same mask property as the check, pointed at another glyph, and the form still submits a boolean rather than a third value."
          layout="stack"
        >
          <Checkbox indeterminate>Partially checked</Checkbox>
          <Checkbox indeterminate description="Nothing changes in what is sent.">
            With description
          </Checkbox>
        </Scene>
        <Scene
          label="A state the group derives"
          note="Tick the first box and the whole set follows; untick any one of them and the first goes back to the dash, because it reads the set rather than keeping a state of its own."
          layout="stack"
        >
          <Permissions />
        </Scene>
      </Grid>
    );
  },
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The box before the label"
        note="The default, and the arrangement a form uses: the box starts the row, the label owns the gap after it, and the description aligns under the text."
        layout="stack"
      >
        <Checkbox defaultChecked description="The description follows the label.">
          Receive notices
        </Checkbox>
        <Checkbox>Receber resumo semanal</Checkbox>
      </Scene>
      <Scene
        label="The box after the label"
        note="The controls line up with each other at the end of the row rather than each one hugging its own label, which is what a settings list needs and what a column of different-length labels would otherwise lose."
        layout="stack"
      >
        <Checkbox defaultChecked labelPlacement="start">
          Email notifications
        </Checkbox>
        <Checkbox labelPlacement="start">SMS notifications</Checkbox>
        <Checkbox labelPlacement="start">In-app notifications</Checkbox>
      </Scene>
    </Grid>
  ),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Described, and not named"
        note="A screen reader announces the label as the name and the paragraph as the description, and clicking the paragraph toggles nothing — which is why it sits outside the label element."
        layout="stack"
      >
        <Checkbox description="One summary per day, never more than one. Can be turned off at any time.">
          Receive email notices
        </Checkbox>
      </Scene>
      <Scene
        label="At the smallest step, in a narrow column"
        note="The description drops one step below the label’s type and keeps its alignment under the text, so a set of options in a 320-pixel drawer still reads as a list rather than as a paragraph."
        layout="stack"
      >
        <Measure>
          <CheckboxGroup size="sm">
            <Checkbox description="After that the note is archived." value="a">
              Keep for 90 days
            </Checkbox>
            <Checkbox description="Applies to all branches." value="b">
              Apply to the whole group
            </Checkbox>
          </CheckboxGroup>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A set of boxes under one legend"
        note="The fieldset and its legend are what group and name the set, so the group inside it withdraws its own role rather than announcing the same set twice."
        layout="stack"
      >
        <FieldGroup required>
          <FieldGroupLegend>Notifications</FieldGroupLegend>
          <CheckboxGroup defaultValue={['approved']} name="alerts">
            <Checkbox value="approved">Order approved</Checkbox>
            <Checkbox value="refused">Order refused</Checkbox>
            <Checkbox value="shipped">Order shipped</Checkbox>
          </CheckboxGroup>
        </FieldGroup>
      </Scene>
      <Scene
        label="A disabled group, from the platform"
        note="Only the fieldset carries disabled. Every box inside it is disabled by the browser with nothing passed down, and each label dims from its own control’s state."
        layout="stack"
      >
        <FieldGroup disabled>
          <FieldGroupLegend>While the account is suspended</FieldGroupLegend>
          <CheckboxGroup defaultValue={['approved']}>
            <Checkbox value="approved">Order approved</Checkbox>
            <Checkbox value="refused">Order refused</Checkbox>
          </CheckboxGroup>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A label that wraps"
        note="The box stays on the first line box of the label rather than centring itself against the whole block, which is where align-items would put it as soon as the text reaches a second line."
        layout="stack"
      >
        <Checkbox
          defaultChecked
          description="The box stays on the first line of the label, not in the middle of the text block."
        >
          I agree to receive communications about contract changes, delivery deadlines and changes
          to the returns policy of this and the other stores in the group.
        </Checkbox>
      </Scene>
      <Scene
        label="Content the family did not choose"
        note="An unbroken token breaks instead of taking the page’s horizontal scrollbar with it, and a right-to-left label mirrors the whole row — the same component, not a rearranged one."
        layout="stack"
      >
        <Measure>
          <Checkbox>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0</Checkbox>
          <Checkbox defaultChecked dir="rtl">
            أوافق على تلقي رسائل حول التغييرات في العقد ومواعيد التسليم.
          </Checkbox>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    function Focused() {
      const ref = useRef<HTMLInputElement>(null);
      return (
        <>
          <Checkbox ref={ref}>A box that the button reaches</Checkbox>
          <Button onClick={() => ref.current?.focus()} size="sm" variant="outline">
            Focus the box
          </Button>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="Two decisions an application takes once"
          note="The provider is outranked by the group and by the field, so a section can still be compact inside an application that is comfortable everywhere else."
          layout="stack"
        >
          <CheckboxDefaultsProvider labelPlacement="start" size="sm">
            <Checkbox defaultChecked>Inherits the step and the side</Checkbox>
            <Checkbox>And this one too</Checkbox>
          </CheckboxDefaultsProvider>
        </Scene>
        <Scene
          label="The element, and the root it stands in"
          note="ref reaches the input, so focus and click are the platform’s own; render replaces the root with a list item and hands it every attribute the family wrote."
          layout="stack"
        >
          <Focused />
          <ul className="slotted-demo-list">
            <Checkbox defaultChecked render={(props) => <li {...props} />}>
              A list item that is also a box
            </Checkbox>
            <Checkbox render={(props) => <li {...props} />}>And another beside it</Checkbox>
          </ul>
        </Scene>
      </Grid>
    );
  },
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    function Reasons() {
      const [reason, setReason] = useState('—');
      return (
        <>
          <Checkbox onCheckedChange={(_, request) => setReason(request.reason)}>
            Check with the pointer, then with the space bar
          </Checkbox>
          <Text size="sm" tone="muted">
            reason: {reason}
          </Text>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="The platform’s whole table"
          note="Tab reaches the box, Space toggles it, and Enter submits the form rather than the control. No key listener exists in this family, which is why the behaviour is already translated and already mirrored."
          layout="stack"
        >
          <Checkbox>Tab to here, then space</Checkbox>
          <Checkbox defaultChecked>And again</Checkbox>
        </Scene>
        <Scene
          label="Which device asked"
          note="A click synthesised by the keyboard reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener existing anywhere."
          layout="stack"
        >
          <Reasons />
        </Scene>
      </Grid>
    );
  },
};

/* ── Checkbox beside Radio, every state, every density, every scheme ──────
 *
 * The acceptance picture for the selection controls (CK1–CK5): the square and
 * the circle side by side so a reader sees, in one place, that the two read
 * the same scale, the same edge, the same halo and the same motion. Not a
 * contract scenario, so it has no reference-page scene; it is the picture the
 * review asked for.
 */

const COMPARISON_SCHEMES = ['light', 'dark', 'high-contrast'] as const;
const COMPARISON_DENSITIES = ['comfortable', 'compact', 'dense'] as const;
const COMPARISON_STATES = [
  'default',
  'hover',
  'focus-visible',
  'checked',
  'indeterminate',
  'disabled',
  'invalid',
] as const;
type ComparisonState = (typeof COMPARISON_STATES)[number];

const COMPARISON_LABELS: Record<ComparisonState, string> = {
  default: 'default',
  hover: 'hover — move the pointer over a box or a circle',
  'focus-visible': 'focus-visible — the first cell holds focus; Tab moves it',
  checked: 'checked',
  indeterminate: 'indeterminate',
  disabled: 'disabled',
  invalid: 'invalid',
};

function ComparisonCell({
  density,
  scheme,
  state,
}: {
  density: (typeof COMPARISON_DENSITIES)[number];
  scheme: (typeof COMPARISON_SCHEMES)[number];
  state: ComparisonState;
}) {
  const key = `${scheme}-${density}-${state}`;
  const disabled = state === 'disabled';
  const invalid = state === 'invalid';
  return (
    <div
      data-comparison-focus={state === 'focus-visible' ? '' : undefined}
      data-slotted-density={density}
    >
      <div className="slotted-demo-stage" data-layout="row">
        <Checkbox
          defaultChecked={state === 'checked'}
          disabled={disabled}
          indeterminate={state === 'indeterminate'}
          invalid={invalid}
        >
          Caixa
        </Checkbox>
        {state === 'indeterminate' ? (
          <Text size="sm" tone="muted">
            sem equivalente
          </Text>
        ) : (
          <RadioGroup
            aria-label={`Radio ${key}`}
            defaultValue={state === 'checked' ? 'a' : undefined}
            disabled={disabled}
            invalid={invalid}
            name={key}
          >
            <Radio value="a">Radio</Radio>
          </RadioGroup>
        )}
      </div>
    </div>
  );
}

export const Comparison: Story = {
  render: () => (
    <div className="slotted-demo-stage" data-layout="stack">
      {COMPARISON_SCHEMES.map((scheme) => (
        <div
          className="slotted-demo-surface"
          data-flow="stack"
          data-slotted-scheme={scheme}
          data-surface="scheme"
          key={scheme}
        >
          <Text size="sm" tone="muted">
            {scheme}
          </Text>
          <WorkbenchMatrix
            columns={[...COMPARISON_DENSITIES]}
            rows={COMPARISON_STATES.map((state) => ({
              label: COMPARISON_LABELS[state],
              cells: COMPARISON_DENSITIES.map((density) => (
                <ComparisonCell density={density} key={density} scheme={scheme} state={state} />
              )),
            }))}
          />
        </div>
      ))}
    </div>
  ),
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLInputElement>('[data-comparison-focus] input')?.focus();
  },
};
