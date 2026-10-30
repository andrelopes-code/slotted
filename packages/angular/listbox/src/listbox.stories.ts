import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlListbox } from './listbox';
import type {
  ListboxIndicatorMode,
  ListboxOrientation,
  ListboxSelectionBehavior,
  ListboxSelectionMode,
  ListboxSize,
  ListboxVariant,
} from './listbox-defaults';
import {
  SlListboxDescription,
  SlListboxEmpty,
  SlListboxGroup,
  SlListboxIcon,
  SlListboxIndicator,
  SlListboxLabel,
  SlListboxLoader,
  SlListboxMeta,
  SlListboxOption,
  SlListboxOptionContent,
} from './listbox-parts';
import { ANGULAR_LISTBOX_DOCS, ANGULAR_LISTBOX_TOKENS } from './listbox.docs';

interface ListboxStoryArgs {
  columns: number;
  disabled: boolean;
  indicator: ListboxIndicatorMode;
  loading: boolean;
  loop: boolean;
  orientation: ListboxOrientation;
  rows: number;
  selectOnFocus: boolean;
  selectionBehavior: ListboxSelectionBehavior;
  selectionMode: ListboxSelectionMode;
  size: ListboxSize;
  typeahead: boolean;
  variant: ListboxVariant;
}

const IMPORTS = [
  SlField,
  SlFieldLabel,
  SlListbox,
  SlListboxDescription,
  SlListboxEmpty,
  SlListboxGroup,
  SlListboxIcon,
  SlListboxIndicator,
  SlListboxLabel,
  SlListboxLoader,
  SlListboxMeta,
  SlListboxOption,
  SlListboxOptionContent,
  SlText,
];

const CITIES = Array.from({ length: 4000 }, (_, index) => ({
  country: ['NO', 'DE', 'BR', 'JP', 'GB'][index % 5] as string,
  id: `city-${index}`,
  name: `City ${String(index + 1).padStart(4, '0')}`,
}));

const props = {
  cities: CITIES,
  cityKey: (city: { id: string }) => city.id,
  cityLabel: (city: { name: string }) => city.name,
};

const option = (value: string, label: string, meta = '', extra = '') => `
      <div slListboxOption value="${value}" ${extra}>
        <span slListboxIndicator></span>
        <span slListboxLabel>${label}</span>
        ${meta === '' ? '' : `<span slListboxMeta>${meta}</span>`}
      </div>`;

const REGIONS = [
  option('europe', 'Europe', '44'),
  option('apac', 'Asia Pacific', '28'),
  option('samerica', 'South America', '12'),
  option('africa', 'Africa', '9'),
  option('namerica', 'North America', '3'),
].join('');

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (scenes: string) => `<div class="slotted-demo-grid">${scenes}</div>`;

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_LISTBOX_DOCS.listbox.scenes, {
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

const meta: Meta<ListboxStoryArgs> = {
  title: 'Components/Listbox',
  component: SlListbox,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Listbox',
        description:
          'A list of options the reader chooses from, with groups, two selection models, typeahead and a window that keeps the active option addressable.',
        framework: 'Angular',
        ...ANGULAR_LISTBOX_DOCS.listbox,
        tokens: ANGULAR_LISTBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ListboxStoryArgs>;

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
  render: (args) => ({
    props: args,
    template: `
<div
  slListbox
  aria-label="Region"
  defaultValue="europe"
  [size]="size"
  [variant]="variant"
  [orientation]="orientation"
  [indicator]="indicator"
  [selectionMode]="selectionMode"
  [selectionBehavior]="selectionBehavior"
  [columns]="columns"
  [rows]="rows"
  [loop]="loop"
  [typeahead]="typeahead"
  [selectOnFocus]="selectOnFocus"
  [disabled]="disabled"
  [loading]="loading"
>${REGIONS}</div>`,
  }),
};

export const Selection: Story = {
  parameters: scenario('selection'),
  render: () => ({
    template: grid(
      scene(
        'single',
        'One choice at a time, and pressing the chosen option again gives it up. disallowEmptySelection is what refuses that press.',
        `<div slListbox aria-label="Permission" defaultValue="write" rows="3">
          ${option('read', 'Read')}${option('write', 'Write')}${option('admin', 'Admin')}
        </div>`,
      ) +
        scene(
          'multiple',
          'A plain press adds and removes one option, which is the model the pattern recommends because it needs no modifier and a touch reader can reach it.',
          `<div slListbox aria-label="Sandwich contents" selectionMode="multiple" rows="5">
          ${option('lettuce', 'Lettuce')}${option('tomato', 'Tomato')}${option('cheese', 'Cheese')}
        </div>`,
        ) +
        scene(
          'none, and read-only',
          'Neither can be changed and both stay reachable. none removes aria-selected outright; readOnly keeps it and says the value is fixed rather than the control dead.',
          `<div slListbox aria-label="Log" selectionMode="none" rows="3">
          ${option('queued', 'Queued')}${option('running', 'Running')}${option('done', 'Finished')}
        </div>`,
        ),
    ),
  }),
};

export const Behavior: Story = {
  parameters: scenario('behavior'),
  render: () => ({
    template: grid(
      scene(
        'toggle — the recommended model',
        'Every press changes one option and no modifier is needed. Shift still selects a range, and Control+A takes everything.',
        `<div slListbox aria-label="Toggle model" selectionMode="multiple" rows="5">${REGIONS}</div>`,
      ) +
        scene(
          'replace — the desktop model',
          'A plain press replaces the whole selection and Control adds one; Control with an arrow moves without choosing. It is what a file list and select multiple do.',
          `<div slListbox aria-label="Replace model" selectionMode="multiple" selectionBehavior="replace" rows="5">${REGIONS}</div>`,
        ),
    ),
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => ({
    props,
    template: grid(
      scene(
        'Groups written in the template',
        'Each group carries its own name, which the pattern requires. The rule between two groups is the group edge, because ARIA lets a listbox own options and groups and nothing else.',
        `<div slListbox aria-label="Fruit" defaultValue="blackcurrant" rows="7">
          <div slListboxGroup label="Pome">
            ${option('apple', 'Apple', '52 kcal')}${option('pear', 'Pear', '57 kcal')}
          </div>
          <div slListboxGroup label="Berry">
            ${option('blackcurrant', 'Blackcurrant', '63 kcal')}${option('gooseberry', 'Gooseberry', '44 kcal')}
          </div>
        </div>`,
      ) +
        scene(
          'Groups built from a collection',
          'The same picture from data. The family flattens the sections into rows, keeps the option index apart from the row index, and numbers the whole set for the reader.',
          `<div
            slListbox
            aria-label="Fruit by family"
            rows="7"
            [sections]="[{ key: 'drupe', label: 'Drupe', items: [{ id: 'plum', name: 'Plum' }] }, { key: 'multiple', label: 'Multiple fruit', items: [{ id: 'fig', name: 'Fig' }, { id: 'mulberry', name: 'Mulberry' }] }]"
            [getKey]="cityKey"
            [getLabel]="cityLabel"
          >
            <ng-template slListboxOptionContent let-item>
              <span slListboxIndicator></span>
              <span slListboxLabel>{{ item.name }}</span>
            </ng-template>
          </div>`,
        ),
    ),
  }),
};

export const Size: Story = {
  parameters: scenario('size'),
  render: () => ({
    template: grid(
      (['sm', 'md', 'lg'] as const)
        .map((size) =>
          scene(
            size,
            `An option is a control, so ${size} reads the control height, inset, type and glyph rather than a scale of the family own.`,
            `<div slListbox aria-label="Plan ${size}" size="${size}" defaultValue="pro" rows="3">
              ${option('free', 'Free', '$0')}${option('pro', 'Pro', '$20')}${option('team', 'Team', '$60')}
            </div>`,
          ),
        )
        .join(''),
    ),
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: grid(
      scene(
        'framed',
        'The standalone control: an edge, a ground and the shadow that separates it from the page. It is what select multiple looks like, and what a reader recognises as a control.',
        `<div slListbox aria-label="Framed" defaultValue="europe" rows="3">${REGIONS}</div>`,
      ) +
        scene(
          'plain',
          'No box at all, because the layer around it already has one. It is what Select and Combobox render inside their own surface, where a second edge would draw a box inside a box.',
          `<div slListbox aria-label="Plain" variant="plain" defaultValue="europe" rows="3">${REGIONS}</div>`,
        ),
    ),
  }),
};

export const Layout: Story = {
  parameters: scenario('layout'),
  render: () => ({
    template: grid(
      scene(
        'columns',
        'Three across, and the arrows follow: one option along a row, three down a column. The number is stated rather than measured, so the picture and the keyboard cannot disagree.',
        `<div slListbox aria-label="Planets" columns="3" selectionMode="multiple">
          ${option('mercury', 'Mercury')}${option('venus', 'Venus')}${option('earth', 'Earth')}${option('mars', 'Mars')}${option('jupiter', 'Jupiter')}${option('saturn', 'Saturn')}
        </div>`,
      ) +
        scene(
          'horizontal',
          'Along the inline axis, and mirrored in a right-to-left document. Switch the direction in the toolbar: the arrows turn with the layout rather than staying where they were.',
          `<div slListbox aria-label="Range" orientation="horizontal" defaultValue="week">
          ${option('day', 'Day')}${option('week', 'Week')}${option('month', 'Month')}${option('quarter', 'Quarter')}
        </div>`,
        ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      scene(
        'A disabled option, and a disabled control',
        'Disabled outranks selected: a chosen option that is disabled keeps its mark and loses the ground that said it was yours to change. The option keeps its place in the set either way.',
        `<div slListbox aria-label="Disabled option" defaultValue="apac" rows="3">
          ${option('apac', 'Asia Pacific')}${option('antarctica', 'Antarctica', '', 'disabled')}${option('africa', 'Africa')}
        </div>`,
      ) +
        scene(
          'readonly',
          'Every option stays reachable and every change is refused. It does not look like disabled, because the value is fixed rather than the control dead.',
          `<div slListbox aria-label="Read only" readOnly defaultValue="europe" rows="3">${REGIONS}</div>`,
        ) +
        scene(
          'required and invalid',
          'The edge and the focus ring both turn, and the Field around it owns the message. Colour alone never carries the state: the ring changes as well as the border.',
          `<div slListbox aria-label="Invalid" required invalid rows="3">${REGIONS}</div>`,
        ) +
        scene(
          'disabled, and loading',
          'A disabled listbox answers nothing and stays legible; a loading one writes aria-busy, which ARIA asks of a container whose options have not arrived.',
          `<div slListbox aria-label="Disabled" disabled loading rows="3">${REGIONS}</div>`,
        ),
    ),
  }),
};

export const Typeahead: Story = {
  parameters: scenario('typeahead'),
  render: () => ({
    template: grid(
      scene(
        'Typing at the list',
        'Tab in and type. A repeated letter cycles through the options beginning with it, and a space is a character once a sequence is open — which is what makes New York reachable.',
        `<div slListbox aria-label="Cities" rows="6">
          ${option('ny', 'New York')}${option('newark', 'Newark')}${option('no', 'New Orleans')}${option('nice', 'Nice')}${option('nagoya', 'Nagoya')}
        </div>`,
      ) +
        scene(
          'A label the reader would not type',
          'textValue is what typeahead matches and what a reader hears, which matters when the visible text is a code rather than a name. Type oslo rather than OSL.',
          `<div slListbox aria-label="Airports" rows="4">
          <div slListboxOption value="OSL" textValue="Oslo">
            <span slListboxLabel>OSL</span><span slListboxMeta>Oslo</span>
          </div>
          <div slListboxOption value="BGO" textValue="Bergen">
            <span slListboxLabel>BGO</span><span slListboxMeta>Bergen</span>
          </div>
          <div slListboxOption value="TOS" textValue="Tromsø">
            <span slListboxLabel>TOS</span><span slListboxMeta>Tromsø</span>
          </div>
        </div>`,
        ),
    ),
  }),
};

export const EmptyAndLoading: Story = {
  parameters: scenario('empty-and-loading'),
  render: () => ({
    props,
    template: grid(
      scene(
        'Nothing matches',
        'The message is inside the listbox. Outside it a reader hears listbox, zero items and then silence, and the words fall outside the box a framed listbox paints.',
        `<div slListbox aria-label="Results" rows="3">
          <div slListboxEmpty>No region matches that name.</div>
        </div>`,
      ) +
        scene(
          'A page still arriving',
          'hasMore and loading draw the row at the end of the list and stop the family asking again while a request is out. The row is an option by role and never a choice.',
          `<div
            slListbox
            aria-label="Cities"
            rows="5"
            hasMore
            loading
            totalCount="4000"
            [items]="cities.slice(0, 3)"
            [getKey]="cityKey"
            [getLabel]="cityLabel"
          >
            <ng-template slListboxOptionContent let-city>
              <span slListboxLabel>{{ city.name }}</span>
            </ng-template>
            <div slListboxLoader>Loading more…</div>
          </div>`,
        ),
    ),
  }),
};

export const Virtualization: Story = {
  parameters: scenario('virtualization'),
  render: () => ({
    props,
    template: grid(
      scene(
        'Four thousand options, and the ten that are rendered',
        'Scroll it hard, then press an arrow: the highlight is still where you left it, because the active option is pinned into the window and the listbox names it rather than roving onto it.',
        `<div
          slListbox
          aria-label="Cities"
          virtual
          itemSize="34"
          rows="8"
          defaultActiveKey="city-40"
          [items]="cities"
          [getKey]="cityKey"
          [getLabel]="cityLabel"
        >
          <ng-template slListboxOptionContent let-city>
            <span slListboxIndicator></span>
            <span slListboxLabel>{{ city.name }}</span>
            <span slListboxMeta>{{ city.country }}</span>
          </ng-template>
        </div>`,
      ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      scene(
        'Content the family did not choose',
        'A label that wraps onto three lines, an unbroken URL, a compound German noun and a right-to-left string. The mark stays on the first line and the value column never gives way.',
        `<div slListbox aria-label="Content" defaultValue="long" rows="7">
          <div slListboxOption value="long">
            <span slListboxIndicator></span>
            <span slListboxLabel>A label long enough to wrap onto three lines inside a narrow box, so the mark beside it has somewhere to be wrong</span>
            <span slListboxDescription>The description wraps under the label rather than under the mark</span>
            <span slListboxMeta>1 204</span>
          </div>
          <div slListboxOption value="german">
            <span slListboxIndicator></span>
            <span slListboxLabel>Kraftfahrzeug-Haftpflichtversicherungsbescheinigung</span>
            <span slListboxMeta>DE</span>
          </div>
          <div slListboxOption value="url">
            <span slListboxIndicator></span>
            <span slListboxLabel>https://example.com/a/very/long/unbroken/path/nobody/can/wrap</span>
            <span slListboxMeta>URL</span>
          </div>
          <div slListboxOption value="rtl">
            <span slListboxIndicator></span>
            <span slListboxLabel>مرحبا بالعالم</span>
            <span slListboxMeta>AR</span>
          </div>
        </div>`,
      ),
    ),
  }),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => ({
    template: grid(
      scene(
        'A choice a form carries',
        'The listbox is a ControlValueAccessor and a Validator, so a Reactive Form reads its value and required is the collection own validity rather than any one option.',
        `<div slField>
          <label slFieldLabel>Region</label>
          <div slListbox aria-label="Region" required defaultValue="europe" rows="5">${REGIONS}</div>
        </div>`,
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: grid(
      scene(
        'An instance still wins over the injector',
        'provideListboxDefaults sets nineteen axes at once for every listbox under it, and a listbox that states its own size keeps it. An explicit input is never overridden by the token.',
        `<div slListbox aria-label="Default size" defaultValue="europe" rows="3">${REGIONS}</div>
         <div slListbox aria-label="Its own size" size="lg" defaultValue="europe" rows="3">${REGIONS}</div>`,
      ) +
        scene(
          'A role the consumer wrote',
          'HostAttributeToken reads it before the host bindings run, so a template wiring the element into something else keeps what it wrote rather than losing it to the family.',
          `<div slListbox role="listbox" aria-label="Explicit role" defaultValue="europe" rows="3">${REGIONS}</div>`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      scene(
        'Where the keyboard is',
        'Tab in, then arrow, Home, End, PageUp and PageDown. Shift with an arrow moves and toggles; Control+A takes everything and takes it back.',
        `<div slListbox aria-label="Regions" loop selectionMode="multiple" rows="5">${REGIONS}</div>`,
      ) +
        scene(
          'Selection that follows focus',
          'selectOnFocus chooses as the highlight moves, which suits a preview pane and nothing else: the pattern names the accessibility cost, so it is off unless asked for.',
          `<div slListbox aria-label="Preview" selectOnFocus defaultValue="europe" rows="5">${REGIONS}</div>`,
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      scene(
        'Roving, and naming',
        'The same listbox under both focus models. One moves real focus between options; the other keeps focus on the box and writes aria-activedescendant, which is what a combobox needs.',
        `<div slListbox aria-label="Roving" focusMode="roving" defaultValue="europe" rows="3">${REGIONS}</div>
         <div slListbox aria-label="Named" focusMode="activedescendant" defaultActiveKey="apac" defaultValue="europe" rows="3">${REGIONS}</div>`,
      ) +
        scene(
          'An option nobody can reach by accident',
          'navigateDisabled lets the arrows land on a disabled option, which the pattern allows where discoverability is crucial. It still cannot be chosen, however it is pressed.',
          `<div slListbox aria-label="Discoverable" navigateDisabled rows="3">
          ${option('basic', 'Basic')}${option('enterprise', 'Enterprise', 'Contact sales', 'disabled')}
        </div>`,
        ),
    ),
  }),
};
