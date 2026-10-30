import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

import { Field, FieldDescription, FieldLabel } from '../field';
import { Cascader, CascaderPanel } from './cascader';
import { REACT_CASCADER_DOCS, REACT_CASCADER_TOKENS } from './cascader.docs';
import type { CascaderLoadRequest, CascaderProps } from './cascader.types';

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
          leaf('alf', 'Ballard'),
          leaf('bel', 'Bellevue'),
          leaf('chi', 'Fremont'),
          {
            id: 'sintra',
            name: 'King County',
            children: [leaf('sao-pedro', 'Pine Ridge'), leaf('colares', 'Cedar Park')],
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
      { id: 'bcn', name: 'Barcelona', children: [leaf('gra', 'Gracia')] },
    ],
  },
  { id: 'fr', name: 'France', lazy: true },
  { id: 'ad', name: 'Andorra', disabled: true },
];

const data = {
  nodes: PLACES,
  getKey: (place: Place) => place.id,
  getLabel: (place: Place) => place.name,
  getChildren: (place: Place) => place.children,
  hasChildren: (place: Place) => place.lazy === true || (place.children?.length ?? 0) > 0,
  isNodeDisabled: (place: Place) => place.disabled === true,
};

/* A field-wide control near the top of a tall box, so the popup has the room
   under it and the columns are not as wide as the whole page. */
const Viewport = ({ children }: { children: ReactNode }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size="tall">
    <div className="slotted-demo-measure">{children}</div>
  </div>
);

const Places = (props: Partial<CascaderProps<Place>> & { open?: boolean }) => (
  <Cascader<Place> aria-label="Location" portal={false} {...data} {...props} />
);

type Story = StoryObj<typeof Cascader>;

const pictured = (context: Parameters<typeof isolated>[0]) => isolated(context);

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => (
    <Viewport>
      <Places defaultOpen={pictured(context)} defaultValue="bel" />
    </Viewport>
  ),
};

export const Columns: Story = {
  parameters: scenario('columns'),
  render: (_args, context) => (
    <Viewport>
      <Places defaultOpen={pictured(context)} defaultValue="alf" layout="columns" />
    </Viewport>
  ),
};

export const Drill: Story = {
  parameters: scenario('drill'),
  render: (_args, context) => (
    <Viewport>
      <Places defaultOpen={pictured(context)} defaultValue="alf" layout="drill" />
    </Viewport>
  ),
};

export const Tree: Story = {
  parameters: scenario('tree'),
  render: (_args, context) => (
    <Viewport>
      <Places defaultOpen={pictured(context)} defaultValue="alf" layout="tree" />
    </Viewport>
  ),
};

export const LayoutAuto: Story = {
  parameters: scenario('layout-auto'),
  render: (_args, context) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Viewport>
        <Places defaultOpen={pictured(context)} defaultValue="sao-pedro" maxColumns={3} />
      </Viewport>
      <Viewport>
        <Places
          defaultOpen={pictured(context)}
          defaultValue="sao-pedro"
          layout="columns"
          maxColumns={2}
        />
      </Viewport>
    </div>
  ),
};

export const Search: Story = {
  parameters: scenario('search'),
  render: (_args, context) => (
    <Viewport>
      <Places defaultOpen={pictured(context)} defaultSearchValue="bel" layout="drill" search />
    </Viewport>
  ),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: (_args, context) => (
    <Viewport>
      <Places
        checkedStrategy="parent"
        defaultOpen={pictured(context)}
        defaultValue={['alf', 'bel', 'opo']}
        layout="columns"
        selectionMode="multiple"
      />
    </Viewport>
  ),
};

export const AnyLevel: Story = {
  parameters: scenario('any-level'),
  render: (_args, context) => (
    <Viewport>
      <Places
        defaultOpen={pictured(context)}
        defaultValue="lis"
        layout="columns"
        selectable="any"
      />
    </Viewport>
  ),
};

/* A level that arrives after a pause, as a server answers. */
function LazyPlaces({ open }: { open: boolean }) {
  const [loaded, setLoaded] = useState<Place[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const nodes = PLACES.map((place) =>
    place.id === 'fr' && loaded !== undefined ? { ...place, children: loaded } : place,
  );
  const onLoadChildren = useCallback(({ key, signal }: CascaderLoadRequest) => {
    if (key !== 'fr') return;
    setLoading(true);
    const timer = setTimeout(() => {
      setLoaded([leaf('par', 'Paris'), leaf('lyo', 'Lyon'), leaf('mar', 'Marseille')]);
      setLoading(false);
    }, 1200);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      setLoading(false);
    });
  }, []);
  return (
    <Places
      defaultOpen={open}
      defaultPath={['fr']}
      isNodeLoading={(place) => place.id === 'fr' && loading}
      layout="columns"
      nodes={nodes}
      onLoadChildren={onLoadChildren}
    />
  );
}

export const Lazy: Story = {
  parameters: scenario('lazy'),
  render: (_args, context) => (
    <Viewport>
      <LazyPlaces open={pictured(context)} />
    </Viewport>
  ),
};

export const ValuePath: Story = {
  parameters: scenario('value-path'),
  render: () => (
    <div className="slotted-demo-stage" data-layout="stack">
      <div className="slotted-demo-measure" data-width="drawer">
        <Places defaultValue="sao-pedro" />
      </div>
      <Places defaultValue="sao-pedro" separator="›" />
      <Places
        defaultValue="bel"
        renderValue={(path) => `${path.at(-1)?.name ?? ''} (${path[0]?.name ?? ''})`}
      />
    </div>
  ),
};

export const Panel: Story = {
  parameters: scenario('panel'),
  render: () => (
    <CascaderPanel<Place> aria-label="Location" defaultValue="alf" layout="columns" {...data} />
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: (_args, context) => (
    <div className="slotted-demo-stage" data-layout="stack">
      <Places defaultValue="alf" disabled />
      <Places defaultValue="alf" readOnly />
      <Places invalid />
      <Viewport>
        <Places
          defaultOpen={pictured(context)}
          defaultPath={['fr']}
          isNodeFailed={(place) => place.id === 'fr'}
          layout="columns"
        />
      </Viewport>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Viewport>
      <Places defaultValue="bel" layout="columns" />
    </Viewport>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Field required>
      <FieldLabel>Delivery area</FieldLabel>
      <Cascader<Place> name="area" portal={false} {...data} />
      <FieldDescription>Choose the district.</FieldDescription>
    </Field>
  ),
};

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_CASCADER_DOCS.cascader.scenes, {
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

const meta = {
  title: 'Components/Cascader',
  component: Cascader,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Cascader',
        description:
          'A control that picks one place in a hierarchy, or several: columns while there is room, one level at a time where there is not, or an indented list.',
        framework: 'React',
        ...REACT_CASCADER_DOCS.cascader,
        tokens: REACT_CASCADER_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Cascader>;

export default meta;
