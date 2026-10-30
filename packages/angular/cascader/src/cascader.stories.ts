import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlCascader, SlCascaderPanel } from './cascader';
import { SlCascaderNode } from './cascader-body';
import { ANGULAR_CASCADER_DOCS, ANGULAR_CASCADER_TOKENS } from './cascader.docs';
import type { CascaderLoadRequest } from './cascader-engine';

interface Place {
  id: string;
  name: string;
  children?: Place[];
  lazy?: boolean;
  disabled?: boolean;
}

const leaf = (id: string, name: string): Place => ({ id, name });

const PLACES: Place[] = [
  {
    id: 'pt',
    name: 'Portugal',
    children: [
      {
        id: 'lis',
        name: 'Lisboa',
        children: [
          leaf('alf', 'Fremont'),
          leaf('bel', 'Bellevue'),
          leaf('chi', 'Ballard'),
          {
            id: 'sintra',
            name: 'King County',
            children: [leaf('sao-pedro', 'Pine Ridge'), leaf('colares', 'Redmond')],
          },
        ],
      },
      { id: 'opo', name: 'Porto', children: [leaf('rib', 'Ribeira'), leaf('bon', 'Bonfim')] },
      { id: 'coi', name: 'Coimbra', children: [leaf('alm', 'Almedina')] },
    ],
  },
  {
    id: 'es',
    name: 'España',
    children: [
      { id: 'mad', name: 'Madrid', children: [leaf('sol', 'Sol'), leaf('ret', 'Retiro')] },
      { id: 'bcn', name: 'Barcelona', children: [leaf('gra', 'Gràcia')] },
    ],
  },
  { id: 'fr', name: 'France', lazy: true },
  { id: 'ad', name: 'Andorra', disabled: true },
];

/* What every story binds: the hierarchy and how to read it. */
const data = {
  places: PLACES,
  key: (place: Place) => place.id,
  label: (place: Place) => place.name,
  children: (place: Place) => place.children,
  hasChildren: (place: Place) => place.lazy === true || (place.children?.length ?? 0) > 0,
  disabledNode: (place: Place) => place.disabled === true,
  failed: (place: Place) => place.id === 'fr',
};

const bind =
  '[nodes]="places" [getKey]="key" [getLabel]="label" [getChildren]="children" [hasChildren]="hasChildren" [isNodeDisabled]="disabledNode"';

const viewport = (inner: string) => `
  <div class="slotted-demo-viewport" data-place="top" data-size="tall">
    <div class="slotted-demo-measure">${inner}</div>
  </div>
`;

const single = (context: never, attributes: string) => ({
  props: { pictured: isolated(context), ...data },
  template: viewport(
    `<sl-cascader aria-label="Location" [portal]="false" [open]="pictured" ${bind} ${attributes} />`,
  ),
});

type Story = StoryObj<SlCascader>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => single(context as never, `[value]="'bel'"`),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: (_args, context) => single(context as never, `layout="columns" [value]="'alf'"`),
};

export const Drill: Story = {
  parameters: scenario('drill'),
  render: (_args, context) => single(context as never, `layout="drill" [value]="'alf'"`),
};

export const Tree: Story = {
  parameters: scenario('tree'),
  render: (_args, context) => single(context as never, `layout="tree" [value]="'alf'"`),
};

export const LayoutAuto: Story = {
  parameters: scenario('layout-auto'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data },
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        ${viewport(`<sl-cascader aria-label="Location" [portal]="false" [open]="pictured" ${bind} [value]="'sao-pedro'" />`)}
        ${viewport(`<sl-cascader aria-label="Location" [portal]="false" [open]="pictured" ${bind} layout="columns" [maxColumns]="2" [value]="'sao-pedro'" />`)}
      </div>
    `,
  }),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: (_args, context) =>
    single(context as never, `layout="drill" [search]="true" [searchValue]="'bel'"`),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: (_args, context) =>
    single(
      context as never,
      `layout="columns" selectionMode="multiple" checkedStrategy="parent" [value]="['alf', 'bel', 'opo']"`,
    ),
};

export const AnyLevel: Story = {
  parameters: scenario('any-level'),
  render: (_args, context) =>
    single(context as never, `layout="columns" selectable="any" [value]="'lis'"`),
};

/* A level that arrives after a pause, as a server answers. */
function lazyState() {
  const state = {
    places: PLACES as Place[],
    loading: false,
    isLoading: (place: Place) => place.id === 'fr' && state.loading,
    load: ({ key, signal }: CascaderLoadRequest) => {
      if (key !== 'fr') return;
      state.loading = true;
      const timer = setTimeout(() => {
        state.places = PLACES.map((place) =>
          place.id === 'fr'
            ? { ...place, children: [leaf('par', 'Paris'), leaf('lyo', 'Lyon')] }
            : place,
        );
        state.loading = false;
      }, 1200);
      signal.addEventListener('abort', () => clearTimeout(timer));
    },
  };
  return state;
}

export const Lazy: Story = {
  parameters: scenario('lazy'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data, lazy: lazyState() },
    template: viewport(
      `<sl-cascader aria-label="Location" layout="columns" [portal]="false" [open]="pictured"
        [nodes]="lazy.places" [getKey]="key" [getLabel]="label" [getChildren]="children"
        [hasChildren]="hasChildren" [isNodeLoading]="lazy.isLoading" [path]="['fr']"
        (loadChildren)="lazy.load($event)" />`,
    ),
  }),
};

export const ValuePath: Story = {
  parameters: scenario('value-path'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data },
    template: `
      <div class="slotted-demo-stage" data-layout="stack">
        <div class="slotted-demo-measure" data-width="drawer">
          <sl-cascader aria-label="Location" ${bind} [value]="'sao-pedro'" />
        </div>
        <sl-cascader aria-label="Location" ${bind} separator="›" [value]="'sao-pedro'" />
      </div>
    `,
  }),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data },
    template: `<sl-cascader-panel aria-label="Location" layout="columns" ${bind} [value]="'alf'" />`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data },
    template: `
      <div class="slotted-demo-stage" data-layout="stack">
        <sl-cascader aria-label="Location" ${bind} [disabled]="true" [value]="'alf'" />
        <sl-cascader aria-label="Location" ${bind} [readOnly]="true" [value]="'alf'" />
        <sl-cascader aria-label="Location" ${bind} [invalid]="true" />
        ${viewport(`<sl-cascader aria-label="Location" layout="columns" [portal]="false" [open]="pictured" ${bind} [isNodeFailed]="failed" [path]="['fr']" />`)}
      </div>
    `,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data },
    template: viewport(
      `<sl-cascader aria-label="Location" layout="columns" [portal]="false" ${bind} [value]="'bel'" />`,
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => ({
    props: { pictured: isolated(context), ...data, area: new FormControl<string | null>(null) },
    template: `
      <div class="slotted-demo-measure">
        <sl-cascader aria-label="Delivery area" [portal]="false" [required]="true" ${bind} [formControl]="area">
          <ng-template slCascaderNode let-place>{{ place.name }}</ng-template>
        </sl-cascader>
      </div>
    `,
  }),
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_CASCADER_DOCS.cascader.scenes, {
    'any-level': AnyLevel,
    columns: Columns,
    composition: Composition,
    drill: Drill,
    keyboard: Keyboard,
    lazy: Lazy,
    'layout-auto': LayoutAuto,
    multiple: Multiple,
    panel: Panel,
    playground: Playground,
    search: Search,
    states: States,
    tree: Tree,
    'value-path': ValuePath,
  }) as never;

const meta: Meta<SlCascader> = {
  title: 'Components/Cascader',
  component: SlCascader,
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormsModule, SlCascader, SlCascaderNode, SlCascaderPanel],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Cascader',
        description:
          'A control that picks one place in a hierarchy, or several: columns while there is room, one level at a time where there is not, or an indented list.',
        framework: 'Angular',
        ...ANGULAR_CASCADER_DOCS.cascader,
        tokens: ANGULAR_CASCADER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
