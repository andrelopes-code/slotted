import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field';
import { Combobox } from './combobox';
import { ComboboxDefaultsProvider } from './combobox-defaults';
import { ComboboxGroup, ComboboxItem } from './combobox-items';
import { ComboboxContent, ComboboxInput } from './combobox-parts';
import { REACT_COMBOBOX_DOCS, REACT_COMBOBOX_TOKENS } from './combobox.docs';
import type { ComboboxProps } from './combobox.types';

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

const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'layer'}>
    {children}
  </div>
);

const FRUIT = ['Blueberry', 'Raspberry', 'Cloudberry', 'Grapefruit', 'Pomelo', 'Redcurrant'];

const Options = () => (
  <>
    {FRUIT.map((label) => (
      <ComboboxItem key={label} value={label.toLowerCase()}>
        {label}
      </ComboboxItem>
    ))}
  </>
);

const Basic = ({ children, ...props }: Partial<ComboboxProps>) => (
  <Combobox portal={false} {...props}>
    <ComboboxInput aria-label="Fruit" placeholder="Search fruit" />
    <ComboboxContent aria-label="Fruit">{children ?? <Options />}</ComboboxContent>
  </Combobox>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_COMBOBOX_DOCS.combobox.scenes, {
    async: Async,
    autocomplete: Autocomplete,
    clearable: Clearable,
    composition: Composition,
    'custom-value': CustomValue,
    creation: Creation,
    empty: Empty,
    filtering: Filtering,
    form: InAForm,
    groups: Groups,
    keyboard: Keyboard,
    'long-content': LongContent,
    playground: Playground,
    sizes: Sizes,
    states: States,
    variants: Variants,
  }) as never;

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Combobox',
        description:
          'A text input with a listbox of options filtered by what was typed. The typed text and the chosen key are two contracts, not one.',
        framework: 'React',
        ...REACT_COMBOBOX_DOCS.combobox,
        tokens: REACT_COMBOBOX_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'start',
    allowsCustomValue: false,
    autocomplete: 'list',
    autoHighlight: false,
    clearable: true,
    disabled: false,
    highlightMatch: true,
    loop: false,
    openOn: 'input',
    side: 'bottom',
    size: 'md',
    variant: 'outline',
    width: 'anchor',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args, context) => (
    <Viewport size="tall">
      <Basic {...args} defaultInputValue="berr" defaultOpen={isolated(context)} />
    </Viewport>
  ),
};

export const Filtering: Story = {
  parameters: scenario('filtering'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The default comparison"
        note="Locale-sensitive: resume finds Resumé, and the mark shows the span the collator matched."
      >
        <Viewport>
          <Combobox defaultInputValue="resume" defaultOpen={isolated(context)} portal={false}>
            <ComboboxInput aria-label="Document" />
            <ComboboxContent aria-label="Document">
              <ComboboxItem value="resume">Resumé</ComboboxItem>
              <ComboboxItem value="report">Report</ComboboxItem>
            </ComboboxContent>
          </Combobox>
        </Viewport>
      </Scene>
      <Scene
        label="A comparison of the consumer's own"
        note="startsWith rather than contains, so berr finds nothing and Blue finds one."
      >
        <Viewport>
          <Basic
            defaultInputValue="berr"
            defaultOpen={isolated(context)}
            filter={(label, query) => label.toLowerCase().startsWith(query.toLowerCase())}
          />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Autocomplete: Story = {
  parameters: scenario('autocomplete'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene label="none" note="The popup shows the same options whatever is typed into the field.">
        <Viewport>
          <Basic
            autocomplete="none"
            defaultInputValue="berr"
            defaultOpen={isolated(context)}
            filter={null}
          />
        </Viewport>
      </Scene>
      <Scene label="list" note="The default: the popup shows the options that match what is typed.">
        <Viewport>
          <Basic autocomplete="list" defaultInputValue="berr" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
      <Scene
        label="both"
        note="As list, and the rest of the first match is written into the field as a selected range."
      >
        <Viewport>
          <Basic autocomplete="both" defaultInputValue="blue" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const CustomValue: Story = {
  parameters: scenario('custom-value'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Refused"
        note="Enter — and leaving the field — put the text back to the committed option's label, which is the pattern's own reverts. `onInputReset` carries what was refused (CB7)."
      >
        <Viewport>
          <Basic defaultInputValue="Durian" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
      <Scene
        label="Allowed"
        note="Enter — and leaving the field — commit the typed text, and the request carries it as the value."
      >
        <Viewport>
          <Basic allowsCustomValue defaultInputValue="Durian" defaultOpen={isolated(context)} />
        </Viewport>
      </Scene>
    </div>
  ),
};

/**
 * CB8. The family draws the offer and reports the query; adding the value is
 * the consumer's, because only it knows which of its collections can grow.
 *
 * The item asks for a tag input here. This family declines `multiple` — its
 * contract defers a collection of chosen values to `multi-select` — so the
 * story shows creation on the one value a combobox holds.
 */
function Creatable() {
  const [items, setItems] = useState<readonly string[]>(FRUIT);
  const [value, setValue] = useState<string | null>(null);

  return (
    <Combobox
      onCreate={(query) => {
        setItems((held) => [...held, query]);
        setValue(query);
      }}
      onValueChange={setValue}
      value={value}
    >
      <ComboboxInput aria-label="Fruit" />
      <ComboboxContent aria-label="Fruit">
        {items.map((label) => (
          <ComboboxItem key={label} value={label}>
            {label}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  );
}

export const Creation: Story = {
  parameters: scenario('creation'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Offered"
        note="Nothing matched, so the last option offers to add what was typed. It is an option: ArrowDown reaches it and Enter takes it."
      >
        <Viewport>
          <Basic defaultInputValue="Durian" defaultOpen={isolated(context)} onCreate={() => {}} />
        </Viewport>
      </Scene>
      <Scene
        label="Taken"
        note="Selecting it calls onCreate with the query and selects nothing; here the consumer adds the value to its own collection and then chooses it."
      >
        <Viewport>
          <Creatable />
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Async: Story = {
  parameters: scenario('async'),
  render: (_args, context) => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Travelling"
        note="The status row keeps the popup's measure, so nothing jumps when the results land."
      >
        <Viewport>
          <Combobox defaultInputValue="mar" defaultOpen={isolated(context)} loading portal={false}>
            <ComboboxInput aria-label="Reviewer" />
            <ComboboxContent aria-label="Reviewer" />
          </Combobox>
        </Viewport>
      </Scene>
      <Scene
        label="Landed"
        note="The same row becomes the live region, and says how many options answered."
      >
        <Viewport>
          <Combobox defaultInputValue="man" defaultOpen={isolated(context)} portal={false}>
            <ComboboxInput aria-label="Reviewer" />
            <ComboboxContent aria-label="Reviewer">
              <ComboboxItem value="amanda">Amanda Okoro</ComboboxItem>
              <ComboboxItem value="roman">Roman Petrov</ComboboxItem>
              <ComboboxItem value="norman">Norman Vaz</ComboboxItem>
            </ComboboxContent>
          </Combobox>
        </Viewport>
      </Scene>
    </div>
  ),
};

export const Groups: Story = {
  parameters: scenario('groups'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Combobox defaultInputValue="berry" defaultOpen={isolated(context)} portal={false}>
        <ComboboxInput aria-label="Produce" />
        <ComboboxContent aria-label="Produce">
          <ComboboxGroup label="Berries">
            <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
            <ComboboxItem value="raspberry">Raspberry</ComboboxItem>
          </ComboboxGroup>
          <ComboboxGroup label="Citrus">
            <ComboboxItem value="grapefruit">Grapefruit</ComboboxItem>
            <ComboboxItem value="pomelo">Pomelo</ComboboxItem>
          </ComboboxGroup>
        </ComboboxContent>
      </Combobox>
    </Viewport>
  ),
};

export const Clearable: Story = {
  parameters: scenario('clearable'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Empty"
        note="The button is absent until the field holds something to take back."
      >
        <Basic />
      </Scene>
      <Scene
        label="Holding a value"
        note="One press takes both the text and the chosen key, and returns focus."
      >
        <Basic defaultInputValue="Blueberry" defaultValue="blueberry" />
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic defaultInputValue="Blueberry" size="sm" />
      <Basic defaultInputValue="Blueberry" size="md" />
      <Basic defaultInputValue="Blueberry" size="lg" />
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic defaultInputValue="Blueberry" variant="outline" />
      <Basic defaultInputValue="Blueberry" variant="subtle" />
      <Basic defaultInputValue="Blueberry" variant="plain" />
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stack">
      <Basic required />
      <Basic defaultInputValue="Durian" invalid />
      <Basic defaultInputValue="Blueberry" readOnly />
      <Basic defaultInputValue="Blueberry" disabled />
    </div>
  ),
};

export const Empty: Story = {
  parameters: scenario('empty'),
  render: (_args, context) => (
    <Viewport>
      <Basic defaultInputValue="zzz" defaultOpen={isolated(context)} />
    </Viewport>
  ),
};

export const LongContent: Story = {
  parameters: scenario('long-content'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Combobox defaultInputValue="9f2c" defaultOpen={isolated(context)} portal={false}>
        <ComboboxInput aria-label="Record" />
        <ComboboxContent aria-label="Record">
          <ComboboxItem value="urn">urn:acme:catalogue:9f2c41ab8de07c5511903fbe</ComboboxItem>
          <ComboboxItem
            description="An option long enough to need a second line, and it stops there"
            value="fi"
          >
            Rekisteröintitunnus 9f2c, pitkä ja käännetty, ja vielä pidempi kuin ensimmäinen
          </ComboboxItem>
        </ComboboxContent>
      </Combobox>
    </Viewport>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: (_args, context) => (
    <Viewport size="tall">
      <Basic defaultInputValue="berr" defaultOpen={isolated(context)} />
    </Viewport>
  ),
};

export const InAForm: Story = {
  parameters: scenario('form'),
  render: function Render() {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
      <div className="slotted-demo-stack">
        <Field required>
          <FieldLabel>Reviewer</FieldLabel>
          <Basic name="reviewer" onValueChange={(next) => setChosen(next)} />
          <FieldDescription>
            {chosen === null
              ? 'The hidden input submits the key, not the text.'
              : `Submitting ${chosen}.`}
          </FieldDescription>
        </Field>
        <Field invalid required>
          <FieldLabel>Second reviewer</FieldLabel>
          <Basic name="second" />
          <FieldError>Choose someone from the list.</FieldError>
        </Field>
      </div>
    );
  },
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: (_args, context) => (
    <ComboboxDefaultsProvider size="sm" variant="subtle">
      <Viewport size="tall">
        <Basic
          defaultInputValue="zzz"
          defaultOpen={isolated(context)}
          messages={{ empty: 'Nothing grows by that name' }}
        />
      </Viewport>
    </ComboboxDefaultsProvider>
  ),
};
