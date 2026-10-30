import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { MultiSelect } from './multi-select';
import { MultiSelectDefaultsProvider } from './multi-select-defaults';
import { MultiSelectGroup, MultiSelectItem, MultiSelectSeparator } from './multi-select-items';
import { MultiSelectContent, MultiSelectControl } from './multi-select-parts';
import { REACT_MULTI_SELECT_DOCS, REACT_MULTI_SELECT_TOKENS } from './multi-select.docs';
import type { MultiSelectHandle, MultiSelectProps } from './multi-select.types';

/**
 * Every demonstration is `portal={false}` inside the workbench's own viewport
 * box, so a popup opened in one scene cannot draw over the scene above it.
 */
const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

/**
 * The box a layer opens into. It is only as tall as it needs to be: thirteen
 * rems while the popup is open, and the four rems a control alone occupies
 * while it is not — a 34-pixel control at the top of a 208-pixel box is the
 * empty canvas `references/stories.md` refuses, and the popup is closed on the
 * reference page by design.
 */
const Viewport = ({ children, open }: { children: ReactNode; open: boolean }) => (
  <div
    className="slotted-demo-viewport"
    data-place="top"
    {...(open ? { 'data-size': 'tall' } : {})}
  >
    {children}
  </div>
);

/**
 * One domain for the whole page: the incident report an on-call engineer fills
 * in. Real service names, real labels, real people — because a control's
 * defects only appear against content a product would actually hold.
 */
const SERVICES = [
  { value: 'checkout-api', group: 'Payments', note: 'Node 22 · eu-west-1' },
  { value: 'payments-worker', group: 'Payments', note: 'Go 1.24 · eu-west-1' },
  { value: 'billing-web', group: 'Payments', note: 'Next.js · edge' },
  { value: 'auth-gateway', group: 'Platform', note: 'Rust · global' },
  { value: 'notification-relay', group: 'Platform', note: 'Elixir · eu-west-1' },
  { value: 'search-indexer', group: 'Platform', note: 'Java 21 · eu-central-1' },
  { value: 'webhooks-dispatcher', group: 'Integrations', note: 'Node 22 · us-east-1' },
  { value: 'reporting-etl', group: 'Integrations', note: 'Python 3.13 · nightly' },
];

const LABELS = ['regression', 'data-loss', 'customer-reported', 'needs-postmortem'];

const RESPONDERS = [
  { value: 'ana.pereira', label: 'Ana Pereira', note: 'Payments · on call' },
  { value: 'tomas.lindqvist', label: 'Tomas Lindqvist', note: 'Platform' },
  { value: 'wei.zhang', label: 'Wei Zhang', note: 'Integrations' },
  { value: 'nadia.haddad', label: 'Nadia Haddad', note: 'SRE · escalation' },
];

const Services = () => (
  <>
    {SERVICES.map((service) => (
      <MultiSelectItem description={service.note} key={service.value} value={service.value}>
        {service.value}
      </MultiSelectItem>
    ))}
  </>
);

const Basic = ({ children, ...props }: Partial<MultiSelectProps>) => (
  <MultiSelect portal={false} {...props}>
    <MultiSelectControl aria-label="Affected services" placeholder="Add a service" />
    <MultiSelectContent aria-label="Affected services">
      {children ?? <Services />}
    </MultiSelectContent>
  </MultiSelect>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_MULTI_SELECT_DOCS['multi-select'].scenes, {
    chips: Chips,
    composition: Composition,
    creation: Creation,
    duplicates: Duplicates,
    editing: Editing,
    filtering: Filtering,
    form: InAForm,
    groups: Groups,
    keyboard: Keyboard,
    limit: Limit,
    'loading-and-empty': LoadingAndEmpty,
    'long-content': LongContent,
    overflow: Overflow,
    paste: Paste,
    playground: Playground,
    reorder: Reorder,
    sizes: Sizes,
    states: States,
    variants: Variants,
  }) as never;

const meta = {
  title: 'Components/Multi Select',
  component: MultiSelect,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Multi Select',
        description:
          'A frame of chosen values, with a field that adds more. The set is ordered, the order is the reader’s, and what the control refuses is reported rather than dropped.',
        framework: 'React',
        ...REACT_MULTI_SELECT_DOCS['multi-select'],
        tokens: REACT_MULTI_SELECT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'start',
    chosenOptions: 'show',
    clearable: true,
    closeOnSelect: false,
    creatable: false,
    disabled: false,
    editable: false,
    highlightMatch: true,
    loop: false,
    overflow: 'wrap',
    reorderable: false,
    side: 'bottom',
    size: 'md',
    variant: 'outline',
    width: 'anchor',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => (
    <Viewport open={isolated(context)}>
      <Basic
        {...args}
        defaultOpen={isolated(context)}
        defaultValue={['checkout-api', 'payments-worker']}
      />
    </Viewport>
  ),
};

export const Chips: Story = {
  parameters: scenario('chips'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Inside the frame, beside the caret"
        note="This control holds a real input, so a chip's remove button is not a button inside a button — which is why select draws its row above the control instead."
      >
        <Basic defaultValue={['checkout-api', 'auth-gateway', 'reporting-etl']} />
      </Scene>
      <Scene
        label="The frame grows by whole rows"
        note="An empty control is exactly the height of a text field beside it; each wrapped row adds one chip and one gap, and the fourth row scrolls rather than showing a sliver."
      >
        <Basic defaultValue={SERVICES.map((service) => service.value)} />
      </Scene>
    </div>
  ),
};

/** Text becomes a value here, where a combobox only reports the query. */
function Creatable() {
  const [labels, setLabels] = useState<readonly string[]>(['regression']);

  return (
    <MultiSelect creatable onValueChange={setLabels} portal={false} value={labels}>
      <MultiSelectControl aria-label="Labels" placeholder="Add a label" />
      <MultiSelectContent aria-label="Labels">
        {LABELS.map((label) => (
          <MultiSelectItem key={label} value={label}>
            {label}
          </MultiSelectItem>
        ))}
      </MultiSelectContent>
    </MultiSelect>
  );
}

export const Creation: Story = {
  parameters: scenario('creation'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Refused"
        note="Without creatable, typing a label the list does not hold matches nothing and Enter does nothing: the set only ever holds options."
      >
        <Basic defaultInputValue="rollback" />
      </Scene>
      <Scene
        label="Offered"
        note="With creatable the offer is an option — the arrows reach it and Enter takes it — and its mark is the plus, because nothing is in the set yet."
      >
        <Creatable />
      </Scene>
    </div>
  ),
};

function Limited() {
  const [refused, setRefused] = useState<string | null>(null);
  const [responders, setResponders] = useState<readonly string[]>(['ana.pereira']);

  return (
    <>
      <MultiSelect
        max={3}
        onValueChange={setResponders}
        onValueRefuse={(values, { cause }) =>
          setRefused(cause === 'limit' ? `Not added: ${values.join(', ')}` : null)
        }
        portal={false}
        value={responders}
      >
        <MultiSelectControl aria-label="Responders" placeholder="Add a responder" />
        <MultiSelectContent aria-label="Responders">
          {RESPONDERS.map((person) => (
            <MultiSelectItem description={person.note} key={person.value} value={person.value}>
              {person.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      {refused === null ? null : <p>{refused}</p>}
    </>
  );
}

export const Limit: Story = {
  parameters: scenario('limit'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Under the limit"
        note="The counter is drawn only because max is set, and it counts in the muted ink while there is room left."
      >
        <Limited />
      </Scene>
      <Scene
        label="Full"
        note="The counter takes the accent, the root carries data-complete, and every responder not already named answers aria-disabled — a value already held stays takeable, because taking it out is what a full control still has to allow."
      >
        <MultiSelect
          defaultValue={['ana.pereira', 'wei.zhang', 'nadia.haddad']}
          max={3}
          portal={false}
        >
          <MultiSelectControl aria-label="Responders" />
          <MultiSelectContent aria-label="Responders">
            {RESPONDERS.map((person) => (
              <MultiSelectItem description={person.note} key={person.value} value={person.value}>
                {person.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Scene>
    </div>
  ),
};

export const Duplicates: Story = {
  parameters: scenario('duplicates'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Refused, and shown where"
        note="The comparison is locale-sensitive, so typing REGRESSION finds the label already held; focus goes to that chip rather than nothing happening."
      >
        <MultiSelect
          creatable
          defaultInputValue="REGRESSION"
          defaultValue={['regression']}
          portal={false}
        >
          <MultiSelectControl aria-label="Labels" />
          <MultiSelectContent aria-label="Labels">
            {LABELS.map((label) => (
              <MultiSelectItem key={label} value={label}>
                {label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Scene>
      <Scene
        label="Allowed"
        note="A picking list where the same item may be counted twice sets allowDuplicates, and the second chip stands beside the first."
      >
        <MultiSelect
          allowDuplicates
          creatable
          defaultValue={['regression', 'regression']}
          portal={false}
        >
          <MultiSelectControl aria-label="Labels" />
          <MultiSelectContent aria-label="Labels">
            {LABELS.map((label) => (
              <MultiSelectItem key={label} value={label}>
                {label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Scene>
    </div>
  ),
};

function Ordered() {
  const [steps, setSteps] = useState<readonly string[]>([
    'auth-gateway',
    'checkout-api',
    'payments-worker',
  ]);
  const [order, setOrder] = useState<string>('');

  return (
    <>
      <MultiSelect
        onValueChange={(next, request) => {
          setSteps(next);
          if (request.reason === 'keyboard') setOrder(next.join(' → '));
        }}
        portal={false}
        reorderable
        value={steps}
      >
        <MultiSelectControl aria-label="Rollback order" />
        <MultiSelectContent aria-label="Rollback order">
          <Services />
        </MultiSelectContent>
      </MultiSelect>
      {order === '' ? null : <p>{order}</p>}
    </>
  );
}

export const Reorder: Story = {
  parameters: scenario('reorder'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Alt with an arrow moves the focused chip"
        note="Reach a chip with ArrowLeft from the empty field, then hold Alt: the arrows follow the writing direction, Alt+Home and Alt+End go to either end, and the request carries keyboard so a saved order listens for exactly that."
      >
        <Ordered />
      </Scene>
    </div>
  ),
};

export const Paste: Story = {
  parameters: scenario('paste'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="One list, split"
        note="Paste checkout-api, payments-worker, billing-web into the field: the same delimiters the comma key reads split the clipboard, so the two paths cannot disagree."
      >
        <Basic addOnPaste creatable />
      </Scene>
      <Scene
        label="More than the limit allows"
        note="Values are taken in order up to the limit and the rest leave through onValueRefuse with the cause — the case none of the eight surveyed implementations describes."
      >
        <Basic addOnPaste creatable max={2} />
      </Scene>
    </div>
  ),
};

export const Editing: Story = {
  parameters: scenario('editing'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Enter on a chip opens it"
        note="A mistyped label is corrected rather than removed and retyped: Enter turns the cell into a field, Enter commits and Escape reverts — the grid pattern’s own answer for a cell holding editable content."
      >
        <MultiSelect creatable defaultValue={['regresion', 'data-loss']} editable portal={false}>
          <MultiSelectControl aria-label="Labels" />
          <MultiSelectContent aria-label="Labels">
            {LABELS.map((label) => (
              <MultiSelectItem key={label} value={label}>
                {label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </Scene>
    </div>
  ),
};

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: (_args, context) => (
    <div className="slotted-demo-grid">
      <Scene
        label="The default comparison"
        note="Locale-sensitive contains, and the mark shows the span the collator matched rather than a substring that would disagree with it."
      >
        <Viewport open={isolated(context)}>
          <Basic defaultInputValue="pay" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
      <Scene
        label="A comparison of the consumer’s own"
        note="startsWith rather than contains, so pay finds payments-worker and nothing else."
      >
        <Viewport open={isolated(context)}>
          <Basic
            defaultInputValue="pay"
            defaultOpen={isolated(context)}
            filter={(label, query) => label.startsWith(query)}
          />
        </Viewport>
      </Scene>
      <Scene
        label="Chosen options withdrawn"
        note="chosenOptions='hide' takes a service already named out of the list, for a collection long enough that a reader would rather see only what is left."
      >
        <Viewport open={isolated(context)}>
          <Basic
            chosenOptions="hide"
            defaultOpen={isolated(context)}
            defaultValue={['checkout-api', 'payments-worker']}
          />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => (
    <div className="slotted-demo-grid">
      <Scene
        label="Three teams, and a rule between two of them"
        note="Type integ and the two groups that answer nothing leave the surface entirely, rather than standing as headings over nothing."
      >
        <Viewport open={isolated(context)}>
          <MultiSelect
            defaultOpen={isolated(context)}
            defaultValue={['checkout-api']}
            portal={false}
          >
            <MultiSelectControl aria-label="Affected services" />
            <MultiSelectContent aria-label="Affected services">
              {['Payments', 'Platform'].map((group) => (
                <MultiSelectGroup key={group} label={group}>
                  {SERVICES.filter((service) => service.group === group).map((service) => (
                    <MultiSelectItem
                      description={service.note}
                      key={service.value}
                      value={service.value}
                    >
                      {service.value}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              ))}
              <MultiSelectSeparator />
              <MultiSelectGroup label="Integrations">
                {SERVICES.filter((service) => service.group === 'Integrations').map((service) => (
                  <MultiSelectItem
                    description={service.note}
                    key={service.value}
                    value={service.value}
                  >
                    {service.value}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Overflow: Story = {
  parameters: scenario('overflow'),
  render: (_args, context) => (
    <div className="slotted-demo-grid">
      <Scene
        label="wrap"
        note="The frame grows by rows to three and then scrolls with no bar of its own: every chip stays in the DOM, and the counter, the row’s own name and the popup’s band are what say there is more."
      >
        <Basic defaultValue={SERVICES.map((service) => service.value)} />
      </Scene>
      <Scene
        label="collapse"
        note="One line high, for a control in a table row: what did not fit becomes a counting chip in the outline variant, and pressing it opens the popup whose band holds every value."
      >
        <Viewport open={isolated(context)}>
          <Basic
            defaultOpen={isolated(context)}
            defaultValue={SERVICES.map((service) => service.value)}
            overflow="collapse"
          />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Three steps, beside an empty one"
        note="An empty control is exactly the height of a text field on the same form; the chip is what changes it, and only at the tightest density does that cost two pixels."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={['checkout-api']} size="sm" />
          <Basic defaultValue={['checkout-api']} size="md" />
          <Basic defaultValue={['checkout-api']} size="lg" />
          <Basic size="md" />
        </div>
      </Scene>
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="outline and subtle"
        note="An edge for a form, and a ground for a panel that already has one."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={['checkout-api']} variant="outline" />
          <Basic defaultValue={['checkout-api']} variant="subtle" />
        </div>
      </Scene>
      <Scene
        label="plain, in the row it exists for"
        note="No edge, no lift and no ground: the row is the ground, and a resting shadow would draw a cell where there is none."
      >
        <div className="slotted-demo-rows">
          <span>INC-4821</span>
          <Basic defaultValue={['checkout-api']} variant="plain" />
          <span>INC-4822</span>
          <Basic defaultValue={['auth-gateway', 'search-indexer']} variant="plain" />
        </div>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="disabled and readOnly"
        note="Disabled answers nothing and keeps its values legible rather than faded away; read-only keeps the caret and the copy, and withholds the popup and every remove control."
      >
        <div className="slotted-demo-stack">
          <Basic defaultValue={['checkout-api']} disabled />
          <Basic defaultValue={['checkout-api', 'auth-gateway']} readOnly />
        </div>
      </Scene>
      <Scene
        label="required and invalid"
        note="The invalid border and the focus ring move together, because the family points the ring token at the danger step rather than repainting each rule that draws focus."
      >
        <div className="slotted-demo-stack">
          <Basic required />
          <Basic invalid required />
        </div>
      </Scene>
    </div>
  ),
};

export const LoadingAndEmpty: Story = {
  parameters: scenario('loading-and-empty'),
  render: (_args, context) => (
    <div className="slotted-demo-grid">
      <Scene
        label="While the answer travels"
        note="The ring stands where the chevron stood, and what was already found stays on the surface while the rest travels: the waiting rows are the shape of what is still coming, under the results that are already there."
      >
        <Viewport open={isolated(context)}>
          <Basic defaultInputValue="pay" defaultOpen={isolated(context)} loading />
        </Viewport>
      </Scene>
      <Scene
        label="Nothing answered"
        note="The message keeps the surface’s measure rather than collapsing it, so nothing jumps when results land."
      >
        <Viewport open={isolated(context)}>
          <Basic defaultInputValue="mainframe" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A name longer than the frame"
        note="The chip truncates and the value stays whole in the accessibility tree and to a page search: truncation never removes content from the DOM."
      >
        <Basic
          defaultValue={[
            'notification-relay-eu-west-1-canary',
            'webhooks-dispatcher-us-east-1-replay',
          ]}
        />
      </Scene>
      <Scene
        label="Under 120 pixels"
        note="A chip narrower than a word is a shape, so the chips withdraw and the counter answers instead. The width is watched rather than queried, because a container query would stop the frame’s width depending on its contents."
      >
        <div className="slotted-demo-measure">
          <Basic defaultValue={['checkout-api', 'auth-gateway', 'reporting-etl']} fullWidth />
        </div>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => (
    <div className="slotted-demo-grid">
      <Scene
        label="One tab stop, and the keys inside it"
        note="Tab reaches the field once. From an empty field Backspace moves to the last chip and removes nothing; a second press removes it. Delete takes the focused chip out, ArrowLeft and ArrowRight walk the row, and any printable character sends the reader back to the field."
      >
        <Viewport open={isolated(context)}>
          <Basic
            defaultOpen={isolated(context)}
            defaultValue={['checkout-api', 'payments-worker', 'auth-gateway']}
          />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Named, described and in error"
        note="One hidden input per value under the name services, so a plain FormData receives all of them under one key. The label, the description and the error reach the field by ID."
      >
        <Field invalid required>
          <FieldLabel>Affected services</FieldLabel>
          <FieldDescription>Everything a customer would have noticed.</FieldDescription>
          <Basic name="services" />
          <FieldError>Name at least one service</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Beside the controls it sits with"
        note="An incident form: the same frame, the same height when empty, and the same focus ring as every other control on it."
      >
        <>
          <Field>
            <FieldLabel>Affected services</FieldLabel>
            <Basic defaultValue={['checkout-api']} name="services" />
          </Field>
          <Field>
            <FieldLabel>Labels</FieldLabel>
            <MultiSelect creatable defaultValue={['regression']} name="labels" portal={false}>
              <MultiSelectControl placeholder="Add a label" />
              <MultiSelectContent aria-label="Labels">
                {LABELS.map((label) => (
                  <MultiSelectItem key={label} value={label}>
                    {label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </Field>
        </>
      </Scene>
    </div>
  ),
};

function WithHandle() {
  const [handle, setHandle] = useState<MultiSelectHandle | null>(null);

  return (
    <div className="slotted-demo-stack">
      <MultiSelect portal={false} ref={setHandle}>
        <MultiSelectControl aria-label="Affected services" />
        <MultiSelectContent aria-label="Affected services">
          <Services />
        </MultiSelectContent>
      </MultiSelect>
      <button
        onClick={() =>
          handle?.setValue(
            SERVICES.map((service) => service.value),
            'programmatic',
          )
        }
        type="button"
      >
        Name every service
      </button>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Defaults an application sets once"
        note="The provider carries every axis; a prop written on one control still wins over it, which is the resolution order every family declares. The words come from the language in force."
      >
        <MultiSelectDefaultsProvider size="sm" variant="subtle">
          <div className="slotted-demo-stack">
            <Basic defaultValue={['checkout-api']} />
            <Basic defaultValue={['auth-gateway']} variant="outline" />
          </div>
        </MultiSelectDefaultsProvider>
      </Scene>
      <Scene
        label="The handle, for what a prop cannot express"
        note="setValue takes the whole set at once under the reason programmatic — which is also the composition that replaces the select-all this family declined."
      >
        <WithHandle />
      </Scene>
    </div>
  ),
};
