import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { Select } from './select';
import { SelectDefaultsProvider } from './select-defaults';
import { SelectGroup, SelectItem, SelectSeparator } from './select-items';
import { SelectContent, SelectTrigger, SelectValue } from './select-parts';
import { REACT_SELECT_DOCS, REACT_SELECT_TOKENS } from './select.docs';
import type { SelectProps, SelectSelection } from './select.types';

/**
 * Every demonstration is `portal={false}` inside the workbench's own viewport
 * box, so a popup opened in one scene cannot draw over the scene above it. The
 * `composition` scene keeps the portal, and says so.
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
 * The box a popup is demonstrated in. `data-place="top"` holds the control near
 * the top with the room under it, which is the shape a surface that opens
 * *below* its control needs.
 */
const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'layer'}>
    {children}
  </div>
);

const FRUIT = [
  { label: 'Apple', value: 'apple' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Grapefruit', value: 'grapefruit' },
  { label: 'Pomelo', value: 'pomelo' },
];

const Options = () => (
  <>
    {FRUIT.map((fruit) => (
      <SelectItem key={fruit.value} value={fruit.value}>
        {fruit.label}
      </SelectItem>
    ))}
  </>
);

const Basic = ({ children, ...props }: Partial<SelectProps>) => (
  <Select portal={false} {...props}>
    <SelectTrigger aria-label="Fruit">
      <SelectValue placeholder="Choose a fruit" />
    </SelectTrigger>
    <SelectContent>{children ?? <Options />}</SelectContent>
  </Select>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SELECT_DOCS.select.scenes, {
    clearable: Clearable,
    composition: Composition,
    form: InAForm,
    groups: Groups,
    keyboard: Keyboard,
    'loading-and-empty': LoadingAndEmpty,
    'long-content': LongContent,
    search: Search,
    multiple: Multiple,
    placeholder: Placeholder,
    placement: Placement,
    playground: Playground,
    selection: Selection,
    sizes: Sizes,
    states: States,
    variants: Variants,
  }) as never;

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Select',
        description:
          'A control that shows the current choice and opens a listbox of the rest. It takes no typed text; a set that is large, remote or searched is Combobox.',
        framework: 'React',
        ...REACT_SELECT_DOCS.select,
        tokens: REACT_SELECT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'start',
    clearable: false,
    disabled: false,
    fullWidth: true,
    loop: false,
    multiple: false,
    side: 'bottom',
    size: 'md',
    typeahead: true,
    variant: 'outline',
    width: 'anchor',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => (
    <Viewport>
      <Basic {...args} defaultOpen={isolated(context)} />
    </Viewport>
  ),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: function Render() {
    const [fruit, setFruit] = useState<SelectSelection>('cherry');
    return (
      <div className="slotted-demo-grid" data-columns="2">
        <Scene
          label="Uncontrolled"
          note="It starts on Blueberry and keeps its own value from there."
        >
          <Basic defaultValue="blueberry" />
        </Scene>
        <Scene
          label="Controlled"
          note={`The page owns it, and it now holds ${fruit ?? 'nothing'}.`}
        >
          <Basic onValueChange={(next) => setFruit(next)} value={fruit} />
        </Scene>
      </div>
    );
  },
};

export const Placeholder: Story = {
  parameters: scenario('placeholder'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene label="Nothing chosen" note="The placeholder, in the muted step, and the same height.">
        <Basic />
      </Scene>
      <Scene
        label="A value it cannot name"
        note="No option matches usr_8f21c0, so the control shows the value rather than looking empty."
      >
        <Basic defaultValue="usr_8f21c0" />
      </Scene>
    </div>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Select
        defaultOpen={isolated(context)}
        defaultValue="raspberry"
        portal={false}
        width="content"
      >
        <SelectTrigger aria-label="Produce">
          <SelectValue placeholder="Choose produce" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup label="Berries">
            <SelectItem value="blueberry">Blueberry</SelectItem>
            <SelectItem description="In season until September" value="raspberry">
              Raspberry
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup label="Citrus">
            <SelectItem value="grapefruit">Grapefruit</SelectItem>
            <SelectItem description="Out of stock" disabled value="pomelo">
              Pomelo
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Viewport>
  ),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Select
        clearable
        defaultOpen={isolated(context)}
        defaultValue={['apple', 'cherry']}
        multiple
        portal={false}
      >
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Choose fruit" />
        </SelectTrigger>
        <SelectContent>
          <Options />
        </SelectContent>
      </Select>
    </Viewport>
  ),
};

export const Clearable: Story = {
  parameters: scenario('clearable'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Nothing to clear"
        note="The button is absent until there is something to take back."
      >
        <Basic clearable />
      </Scene>
      <Scene
        label="Something chosen"
        note="The button appears, and focus goes back to the control after it."
      >
        <Basic clearable defaultValue="cherry" />
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic defaultValue="apple" size="sm" />
      <Basic defaultValue="apple" size="md" />
      <Basic defaultValue="apple" size="lg" />
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic defaultValue="apple" variant="outline" />
      <Basic defaultValue="apple" variant="subtle" />
      <Basic defaultValue="apple" variant="plain" />
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic required />
      <Basic defaultValue="apple" invalid />
      <Basic defaultValue="apple" readOnly />
      <Basic defaultValue="apple" disabled />
    </div>
  ),
};

export const LoadingAndEmpty: Story = {
  parameters: scenario('loading-and-empty'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Loading"
        note="The row keeps the popup's measure, so nothing jumps when the options land."
      >
        <Viewport>
          <Select defaultOpen={isolated(context)} loading portal={false}>
            <SelectTrigger aria-label="Teams">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent status="Fetching teams…" />
          </Select>
        </Viewport>
      </Scene>
      <Scene label="Empty" note="The popup opens onto a sentence rather than onto a two-pixel box.">
        <Viewport>
          <Select defaultOpen={isolated(context)} portal={false}>
            <SelectTrigger aria-label="Teams">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent empty="No teams yet" />
          </Select>
        </Viewport>
      </Scene>
    </div>
  ),
};

/**
 * The countries are a plain list rather than a fixture module: the scene is
 * about a list too long to scan, and twenty-eight labels is what makes the
 * point that six would not.
 */
const COUNTRIES = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Iceland',
  'Ireland',
  'Italy',
  'Japan',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Poland',
  'Portugal',
  'Spain',
  'Sweden',
  'Switzerland',
  'Uruguay',
  'Vietnam',
];

const countryValue = (label: string) => label.toLowerCase().replaceAll(' ', '-');

export const Search: Story = {
  parameters: scenario('search'),
  render: (_args, context) => {
    const [query, setQuery] = useState('');

    return (
      <>
        <Scene
          label="A field above the options"
          note="The query filters the list, the span it matched is marked, and the count is announced. Escape clears the query before it closes the popup; Tab commits and leaves the control."
        >
          <Viewport size="tall">
            <Select defaultOpen={isolated(context)} portal={false} search>
              <SelectTrigger aria-label="Country">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent searchProps={{ placeholder: 'Filter countries' }}>
                {COUNTRIES.map((label) => (
                  <SelectItem key={label} value={countryValue(label)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Viewport>
        </Scene>
        <Scene
          label="The query is a value the page can own"
          note={`It is never the selection: no request carries both. Here the page holds it — currently ${query === '' ? 'empty' : `"${query}"`} — and the family goes on showing the chosen label in the control.`}
        >
          <Viewport size="tall">
            <Select
              defaultValue="japan"
              onSearchValueChange={(next) => setQuery(next)}
              portal={false}
              search
              searchValue={query}
            >
              <SelectTrigger aria-label="Owned query">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((label) => (
                  <SelectItem key={label} value={countryValue(label)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Viewport>
        </Scene>
        <Scene
          label="A list the server already filtered"
          note="filter={null} turns the family's own comparison off, so it renders exactly the window it was given and decides nothing. highlightMatch is off with it: nothing here claims to know what matched."
        >
          <Viewport size="tall">
            <Select highlightMatch={false} filter={null} portal={false} search>
              <SelectTrigger aria-label="Remote">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent searchProps={{ placeholder: 'Search the server' }}>
                {COUNTRIES.slice(0, 4).map((label) => (
                  <SelectItem key={label} value={countryValue(label)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Viewport>
        </Scene>
      </>
    );
  },
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Select clearable defaultOpen={isolated(context)} defaultValue="urn" portal={false}>
        <SelectTrigger aria-label="Record">
          <SelectValue placeholder="Choose a record" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="urn">urn:acme:catalogue:9f2c41ab8de07c5511903fbe</SelectItem>
          <SelectItem
            description="An option long enough to need a second line, and it stops there"
            value="fi"
          >
            Rekisteröintitunnus, pitkä ja käännetty, ja vielä pidempi kuin ensimmäinen
          </SelectItem>
          {Array.from({ length: 100 }, (_, index) => (
            <SelectItem key={index} value={`row-${index}`}>{`Row ${index + 1}`}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Viewport>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="As wide as the control"
        note="The default: the value and the labels share one edge."
      >
        <Viewport>
          <Basic defaultOpen={isolated(context)} defaultValue="apple" width="anchor" />
        </Viewport>
      </Scene>
      <Scene
        label="As wide as its options"
        note='width="content", for a list with descriptions that a field is too narrow for.'
      >
        <Viewport>
          <Select align="end" defaultOpen={isolated(context)} portal={false} width="content">
            <SelectTrigger aria-label="Fruit">
              <SelectValue placeholder="Choose a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem description="Picked this morning, sold by the punnet" value="blueberry">
                Blueberry
              </SelectItem>
              <SelectItem description="Sold by weight" value="cherry">
                Cherry
              </SelectItem>
            </SelectContent>
          </Select>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Basic defaultOpen={isolated(context)} defaultValue="cherry" />
    </Viewport>
  ),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: () => (
    <div className="slotted-demo-stack">
      <Field required>
        <FieldLabel>Fruit</FieldLabel>
        <Basic name="fruit" />
        <FieldDescription>Submitted through a hidden native select.</FieldDescription>
      </Field>
      <Field invalid required>
        <FieldLabel>Delivery day</FieldLabel>
        <Basic name="day" />
        <FieldError>Choose a day.</FieldError>
      </Field>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <SelectDefaultsProvider size="sm" variant="subtle">
      <div className="slotted-demo-stack">
        <Select clearable defaultValue={['apple', 'cherry', 'pomelo']} multiple>
          <SelectTrigger aria-label="Fruit">
            <SelectValue>{(values) => `${values.length} of ${FRUIT.length} chosen`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <Options />
          </SelectContent>
        </Select>
        <Select defaultValue="apple" items={FRUIT}>
          <SelectTrigger aria-label="Fruit, named from items">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <Options />
          </SelectContent>
        </Select>
      </div>
    </SelectDefaultsProvider>
  ),
};
