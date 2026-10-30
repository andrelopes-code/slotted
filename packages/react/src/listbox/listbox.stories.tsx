import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldLabel } from '../field';
import { Text } from '../typography';
import { Listbox } from './listbox';
import { ListboxDefaultsProvider } from './listbox-defaults';
import {
  ListboxDescription,
  ListboxEmpty,
  ListboxGroup,
  ListboxIndicator,
  ListboxLabel,
  ListboxMeta,
  ListboxOption,
} from './listbox-parts';
import { REACT_LISTBOX_DOCS, REACT_LISTBOX_TOKENS } from './listbox.docs';
import type { ListboxValue } from './listbox.types';

const REGIONS = [
  { count: '44', id: 'europe', name: 'Europe' },
  { count: '28', id: 'apac', name: 'Asia Pacific' },
  { count: '12', id: 'samerica', name: 'South America' },
  { count: '9', id: 'africa', name: 'Africa' },
  { count: '3', id: 'namerica', name: 'North America' },
];

const FILLINGS = ['Lettuce', 'Tomato', 'Cheese', 'Tuna salad', 'Ham'];

const CITIES = Array.from({ length: 4000 }, (_, index) => ({
  country: ['NO', 'DE', 'BR', 'JP', 'GB'][index % 5] as string,
  id: `city-${index}`,
  name: `City ${String(index + 1).padStart(4, '0')}`,
}));

const regionOptions = () =>
  REGIONS.map((region) => (
    <ListboxOption key={region.id} value={region.id}>
      <ListboxIndicator />
      <ListboxLabel>{region.name}</ListboxLabel>
      <ListboxMeta>{region.count}</ListboxMeta>
    </ListboxOption>
  ));

const plainOptions = (labels: readonly string[]) =>
  labels.map((label) => (
    <ListboxOption key={label} value={label}>
      <ListboxIndicator />
      <ListboxLabel>{label}</ListboxLabel>
    </ListboxOption>
  ));

const Scene = ({
  children,
  label,
  note,
}: {
  children: React.ReactNode;
  label: string;
  note: string;
}) => (
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

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_LISTBOX_DOCS.listbox.scenes, {
    playground: Playground,
    selection: Selection,
    behavior: Behavior,
    sections: Sections,
    size: Size,
    variant: Variant,
    layout: Layout,
    states: States,
    typeahead: Typeahead,
    'empty-and-loading': EmptyAndLoading,
    virtualization: Virtualization,
    content: Content,
    forms: Forms,
    composition: Composition,
    keyboard: Keyboard,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Listbox',
  component: Listbox,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Listbox',
        description:
          'A list of options the reader chooses from, with groups, two selection models, typeahead and a window that keeps the active option addressable.',
        framework: 'React',
        ...REACT_LISTBOX_DOCS.listbox,
        tokens: REACT_LISTBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    columns: 1,
    disabled: false,
    indicator: 'check',
    loading: false,
    loop: false,
    orientation: 'vertical',
    rows: 7,
    selectOnFocus: false,
    selectionBehavior: 'toggle',
    selectionMode: 'single',
    size: 'md',
    typeahead: true,
    variant: 'framed',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <Listbox {...args} aria-label="Region" defaultValue="europe">
      {regionOptions()}
    </Listbox>
  ),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="single"
        note="One choice at a time, and pressing the chosen option again gives it up. disallowEmptySelection is what refuses that press."
      >
        <Listbox aria-label="Permission" defaultValue="write" rows={3}>
          {plainOptions(['Read', 'Write', 'Admin'])}
        </Listbox>
      </Scene>
      <Scene
        label="multiple"
        note="A plain press adds and removes one option, which is the model the pattern recommends because it needs no modifier and a touch reader can reach it."
      >
        <Listbox
          aria-label="Sandwich contents"
          defaultValue={['Tomato', 'Cheese']}
          rows={5}
          selectionMode="multiple"
        >
          {plainOptions(FILLINGS)}
        </Listbox>
      </Scene>
      <Scene
        label="none, and read-only"
        note="Neither can be changed and both stay reachable. none removes aria-selected outright; readOnly keeps it and says the value is fixed rather than the control dead."
      >
        <Listbox aria-label="Log" rows={3} selectionMode="none">
          {plainOptions(['Queued', 'Running', 'Finished'])}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Behavior: Story = {
  parameters: scenario('behavior'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="toggle — the recommended model"
        note="Every press changes one option and no modifier is needed. Shift still selects a range, and Control+A takes everything."
      >
        <Listbox
          aria-label="Toggle model"
          defaultValue={['Tomato']}
          rows={5}
          selectionMode="multiple"
        >
          {plainOptions(FILLINGS)}
        </Listbox>
      </Scene>
      <Scene
        label="replace — the desktop model"
        note="A plain press replaces the whole selection and Control adds one; Control with an arrow moves without choosing. It is what a file list and select multiple do."
      >
        <Listbox
          aria-label="Replace model"
          defaultValue={['Tomato']}
          rows={5}
          selectionBehavior="replace"
          selectionMode="multiple"
        >
          {plainOptions(FILLINGS)}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Groups written by hand"
        note="Each group carries its own name, which the pattern requires. The rule between two groups is the group edge, because ARIA lets a listbox own options and groups and nothing else."
      >
        <Listbox aria-label="Fruit" defaultValue="blackcurrant" rows={7}>
          <ListboxGroup label="Pome">
            <ListboxOption value="apple">
              <ListboxIndicator />
              <ListboxLabel>Apple</ListboxLabel>
              <ListboxMeta>52 kcal</ListboxMeta>
            </ListboxOption>
            <ListboxOption value="pear">
              <ListboxIndicator />
              <ListboxLabel>Pear</ListboxLabel>
              <ListboxMeta>57 kcal</ListboxMeta>
            </ListboxOption>
          </ListboxGroup>
          <ListboxGroup label="Berry">
            <ListboxOption value="blackcurrant">
              <ListboxIndicator />
              <ListboxLabel>Blackcurrant</ListboxLabel>
              <ListboxMeta>63 kcal</ListboxMeta>
            </ListboxOption>
            <ListboxOption value="gooseberry">
              <ListboxIndicator />
              <ListboxLabel>Gooseberry</ListboxLabel>
              <ListboxMeta>44 kcal</ListboxMeta>
            </ListboxOption>
          </ListboxGroup>
        </Listbox>
      </Scene>
      <Scene
        label="Groups built from a collection"
        note="The same picture from data. The family flattens the sections into rows, keeps the option index apart from the row index, and numbers the whole set for the reader."
      >
        <Listbox
          aria-label="Fruit by family"
          getKey={(item) => (item as { id: string }).id}
          getLabel={(item) => (item as { name: string }).name}
          renderOption={(item) => (
            <>
              <ListboxIndicator />
              <ListboxLabel>{(item as { name: string }).name}</ListboxLabel>
            </>
          )}
          rows={7}
          sections={[
            { items: [{ id: 'plum', name: 'Plum' }], key: 'drupe', label: 'Drupe' },
            {
              items: [
                { id: 'fig', name: 'Fig' },
                { id: 'mulberry', name: 'Mulberry' },
              ],
              key: 'multiple',
              label: 'Multiple fruit',
            },
          ]}
        />
      </Scene>
    </div>
  ),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Scene
          key={size}
          label={size}
          note={`An option is a control, so ${size} reads the control height, inset, type and glyph rather than a scale of the family own.`}
        >
          <Listbox aria-label={`Plan ${size}`} defaultValue="pro" rows={3} size={size}>
            <ListboxOption value="free">
              <ListboxIndicator />
              <ListboxLabel>Free</ListboxLabel>
              <ListboxMeta>$0</ListboxMeta>
            </ListboxOption>
            <ListboxOption value="pro">
              <ListboxIndicator />
              <ListboxLabel>Pro</ListboxLabel>
              <ListboxMeta>$20</ListboxMeta>
            </ListboxOption>
            <ListboxOption value="team">
              <ListboxIndicator />
              <ListboxLabel>Team</ListboxLabel>
              <ListboxMeta>$60</ListboxMeta>
            </ListboxOption>
          </Listbox>
        </Scene>
      ))}
    </div>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="framed"
        note="The standalone control: an edge, a ground and the shadow that separates it from the page. It is what select multiple looks like, and what a reader recognises as a control."
      >
        <Listbox aria-label="Framed" defaultValue="europe" rows={3}>
          {regionOptions()}
        </Listbox>
      </Scene>
      <Scene
        label="plain"
        note="No box at all, because the layer around it already has one. It is what Select and Combobox render inside their own surface, where a second edge would draw a box inside a box."
      >
        <Listbox aria-label="Plain" defaultValue="europe" rows={3} variant="plain">
          {regionOptions()}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="columns"
        note="Three across, and the arrows follow: one option along a row, three down a column. The number is stated rather than measured, so the picture and the keyboard cannot disagree."
      >
        <Listbox aria-label="Planets" columns={3} selectionMode="multiple">
          {plainOptions(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn'])}
        </Listbox>
      </Scene>
      <Scene
        label="horizontal"
        note="Along the inline axis, and mirrored in a right-to-left document. Switch the direction in the toolbar: the arrows turn with the layout rather than staying where they were."
      >
        <Listbox aria-label="Range" defaultValue="Week" orientation="horizontal">
          {plainOptions(['Day', 'Week', 'Month', 'Quarter'])}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A disabled option, and a disabled control"
        note="Disabled outranks selected: a chosen option that is disabled keeps its mark and loses the ground that said it was yours to change. The option keeps its place in the set either way."
      >
        <Listbox aria-label="Disabled option" defaultValue="apac" rows={3}>
          <ListboxOption value="apac">
            <ListboxIndicator />
            <ListboxLabel>Asia Pacific</ListboxLabel>
          </ListboxOption>
          <ListboxOption disabled value="antarctica">
            <ListboxIndicator />
            <ListboxLabel>Antarctica</ListboxLabel>
          </ListboxOption>
          <ListboxOption value="africa">
            <ListboxIndicator />
            <ListboxLabel>Africa</ListboxLabel>
          </ListboxOption>
        </Listbox>
      </Scene>
      <Scene
        label="readonly"
        note="Every option stays reachable and every change is refused. It does not look like disabled, because the value is fixed rather than the control dead."
      >
        <Listbox aria-label="Read only" defaultValue="europe" readOnly rows={3}>
          {regionOptions()}
        </Listbox>
      </Scene>
      <Scene
        label="required and invalid"
        note="The edge and the focus ring both turn, and the Field around it owns the message. Colour alone never carries the state: the ring changes as well as the border."
      >
        <Listbox aria-label="Invalid" invalid required rows={3}>
          {regionOptions()}
        </Listbox>
      </Scene>
      <Scene
        label="disabled, and loading"
        note="A disabled listbox answers nothing and stays legible; a loading one writes aria-busy, which ARIA asks of a container whose options have not arrived."
      >
        <Listbox aria-label="Disabled" disabled loading rows={3}>
          {regionOptions()}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Typeahead: Story = {
  parameters: scenario('typeahead'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Typing at the list"
        note="Tab in and type. A repeated letter cycles through the options beginning with it, and a space is a character once a sequence is open — which is what makes New York reachable."
      >
        <Listbox aria-label="Cities" rows={6}>
          {plainOptions(['New York', 'Newark', 'New Orleans', 'Nice', 'Nagoya', 'Naples'])}
        </Listbox>
      </Scene>
      <Scene
        label="A label the reader would not type"
        note="textValue is what typeahead matches and what a reader hears, which matters when the visible text is a code rather than a name. Type oslo rather than OSL."
      >
        <Listbox aria-label="Airports" rows={4}>
          <ListboxOption textValue="Oslo" value="OSL">
            <ListboxLabel>OSL</ListboxLabel>
            <ListboxMeta>Oslo</ListboxMeta>
          </ListboxOption>
          <ListboxOption textValue="Bergen" value="BGO">
            <ListboxLabel>BGO</ListboxLabel>
            <ListboxMeta>Bergen</ListboxMeta>
          </ListboxOption>
          <ListboxOption textValue="Tromsø" value="TOS">
            <ListboxLabel>TOS</ListboxLabel>
            <ListboxMeta>Tromsø</ListboxMeta>
          </ListboxOption>
        </Listbox>
      </Scene>
    </div>
  ),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Nothing matches"
        note="The message is inside the listbox. Outside it a reader hears listbox, zero items and then silence, and the words fall outside the box a framed listbox paints."
      >
        <Listbox aria-label="Results" rows={3}>
          <ListboxEmpty>No region matches that name.</ListboxEmpty>
        </Listbox>
      </Scene>
      <Scene
        label="A page still arriving"
        note="hasMore and loading draw the row at the end of the list and stop the family asking again while a request is out. The row is an option by role and never a choice."
      >
        <Listbox
          aria-label="Cities"
          getKey={(item) => (item as { id: string }).id}
          getLabel={(item) => (item as { name: string }).name}
          hasMore
          items={CITIES.slice(0, 3)}
          loaderContent="Loading more…"
          loading
          renderOption={(item) => <ListboxLabel>{(item as { name: string }).name}</ListboxLabel>}
          rows={5}
          totalCount={4000}
        />
      </Scene>
    </div>
  ),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Four thousand options, and the ten that are rendered"
        note="Scroll it hard, then press an arrow: the highlight is still where you left it, because the active option is pinned into the window and the listbox names it rather than roving onto it."
      >
        <Listbox
          aria-label="Cities"
          defaultActiveKey="city-0040"
          getKey={(item) => (item as { id: string }).id}
          getLabel={(item) => (item as { name: string }).name}
          itemSize={34}
          items={CITIES}
          renderOption={(item) => (
            <>
              <ListboxIndicator />
              <ListboxLabel>{(item as { name: string }).name}</ListboxLabel>
              <ListboxMeta>{(item as { country: string }).country}</ListboxMeta>
            </>
          )}
          rows={8}
          virtual
        />
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Content the family did not choose"
        note="A label that wraps onto three lines, an unbroken URL, a compound German noun and a right-to-left string. The mark stays on the first line and the value column never gives way."
      >
        <Listbox aria-label="Content" defaultValue="long" rows={7}>
          <ListboxOption value="long">
            <ListboxIndicator />
            <ListboxLabel>
              A label long enough to wrap onto three lines inside a narrow box, so the mark beside
              it has somewhere to be wrong
            </ListboxLabel>
            <ListboxDescription>
              The description wraps under the label rather than under the mark
            </ListboxDescription>
            <ListboxMeta>1 204</ListboxMeta>
          </ListboxOption>
          <ListboxOption value="german">
            <ListboxIndicator />
            <ListboxLabel>Kraftfahrzeug-Haftpflichtversicherungsbescheinigung</ListboxLabel>
            <ListboxMeta>DE</ListboxMeta>
          </ListboxOption>
          <ListboxOption value="url">
            <ListboxIndicator />
            <ListboxLabel>
              https://example.com/a/very/long/unbroken/path/nobody/can/wrap
            </ListboxLabel>
            <ListboxMeta>URL</ListboxMeta>
          </ListboxOption>
          <ListboxOption value="rtl">
            <ListboxIndicator />
            <ListboxLabel>مرحبا بالعالم</ListboxLabel>
            <ListboxMeta>AR</ListboxMeta>
          </ListboxOption>
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A choice a form carries"
        note="name submits one hidden input per chosen key, so a bare form carries the set with no controlled value. The Field owns the label, and required reaches the listbox from it."
      >
        <Field>
          <FieldLabel>Regions</FieldLabel>
          <Listbox
            aria-label="Regions"
            defaultValue={['europe', 'africa']}
            name="regions"
            rows={5}
            selectionMode="multiple"
          >
            {regionOptions()}
          </Listbox>
        </Field>
      </Scene>
    </div>
  ),
};

function ControlledRegion() {
  const [value, setValue] = useState<ListboxValue>('europe');
  const [reason, setReason] = useState('nothing yet');

  return (
    <div className="slotted-demo-stack">
      <Listbox
        aria-label="Region"
        onValueChange={(next, request) => {
          setValue(next);
          setReason(request.reason);
        }}
        rows={5}
        value={value}
      >
        {regionOptions()}
      </Listbox>
      <Text tone="muted">
        {String(value)} — moved by {reason}
      </Text>
    </div>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="One decision for every listbox under it"
        note="The provider sets nineteen axes at once, and the second listbox states its own size and still wins. An explicit value is never overridden by context."
      >
        <ListboxDefaultsProvider size="sm" variant="plain">
          <div className="slotted-demo-stack">
            <Listbox aria-label="From the provider" defaultValue="europe" rows={3}>
              {regionOptions()}
            </Listbox>
            <Listbox aria-label="Its own size" defaultValue="europe" rows={3} size="lg">
              {regionOptions()}
            </Listbox>
          </div>
        </ListboxDefaultsProvider>
      </Scene>
      <Scene
        label="Owning the value, and reading why it moved"
        note="The request carries the value it replaces, the reason and the originating event, and it can be cancelled before anything commits. Press with the pointer, then with Space."
      >
        <ControlledRegion />
      </Scene>
    </div>
  ),
};

function KeyboardWatcher() {
  const [activeKey, setActiveKey] = useState<string | null>('europe');

  return (
    <div className="slotted-demo-stack">
      <Listbox
        activeKey={activeKey}
        aria-label="Regions"
        loop
        onActiveKeyChange={setActiveKey}
        rows={5}
        selectionMode="multiple"
      >
        {regionOptions()}
      </Listbox>
      <Text tone="muted">The keyboard is on {activeKey ?? 'nothing'}</Text>
    </div>
  );
}

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Where the keyboard is, as a value of its own"
        note="Tab in, then arrow, Home, End, PageUp and PageDown. Shift with an arrow moves and toggles; Control+A takes everything and takes it back."
      >
        <KeyboardWatcher />
      </Scene>
      <Scene
        label="Selection that follows focus"
        note="selectOnFocus chooses as the highlight moves, which suits a preview pane and nothing else: the pattern names the accessibility cost, so it is off unless asked for."
      >
        <Listbox aria-label="Preview" defaultValue="europe" rows={5} selectOnFocus>
          {regionOptions()}
        </Listbox>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Roving, and naming"
        note="The same listbox under both focus models. One moves real focus between options; the other keeps focus on the box and writes aria-activedescendant, which is what a combobox needs."
      >
        <div className="slotted-demo-stack">
          <Listbox aria-label="Roving" defaultValue="europe" focusMode="roving" rows={3}>
            {regionOptions()}
          </Listbox>
          <Listbox
            aria-label="Named"
            defaultActiveKey="apac"
            defaultValue="europe"
            focusMode="activedescendant"
            rows={3}
          >
            {regionOptions()}
          </Listbox>
        </div>
      </Scene>
      <Scene
        label="An option nobody can reach by accident"
        note="navigateDisabled lets the arrows land on a disabled option, which the pattern allows where discoverability is crucial. It still cannot be chosen, however it is pressed."
      >
        <Listbox aria-label="Discoverable" navigateDisabled rows={3}>
          <ListboxOption value="basic">
            <ListboxIndicator />
            <ListboxLabel>Basic</ListboxLabel>
          </ListboxOption>
          <ListboxOption disabled value="enterprise">
            <ListboxIndicator />
            <ListboxLabel>Enterprise</ListboxLabel>
            <ListboxMeta>Contact sales</ListboxMeta>
          </ListboxOption>
        </Listbox>
      </Scene>
    </div>
  ),
};
