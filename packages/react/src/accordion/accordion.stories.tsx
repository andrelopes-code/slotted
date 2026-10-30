import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '../collapsible';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Text } from '../typography';
import { Accordion } from './accordion';
import { AccordionDefaultsProvider } from './accordion-defaults';
import { REACT_ACCORDION_DOCS, REACT_ACCORDION_TOKENS } from './accordion.docs';
import type { AccordionHandle, AccordionProps } from './accordion.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_ACCORDION_DOCS.accordion.scenes, {
    playground: Playground,
    multiple: Multiple,
    requireOpen: RequireOpen,
    variant: Variant,
    sizes: Sizes,
    mount: Mount,
    states: States,
    imperative: Imperative,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Accordion',
        description:
          'A set of disclosures that share a value. The pattern’s own keyboard with the arrows added on top of it, a header the set will not let close marked the way the pattern asks, and items that are a family beside this one rather than a part of it.',
        framework: 'React',
        ...REACT_ACCORDION_DOCS.accordion,
        tokens: REACT_ACCORDION_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const SECTIONS = [
  { panel: 'Scheduled for September 12, by Anna Rivers.', title: 'Delivery', value: 'delivery' },
  {
    panel: 'Credit card, approved on September 1.',
    title: 'Payment',
    value: 'payment',
  },
  { panel: 'Issued on September 3, series 4.', title: 'Invoice', value: 'invoice' },
];

function Order({
  sections = SECTIONS,
  ...props
}: Partial<AccordionProps> & { sections?: typeof SECTIONS }) {
  return (
    <Accordion {...props}>
      {sections.map((section) => (
        <Collapsible key={section.value} value={section.value}>
          <CollapsibleHeader>
            <CollapsibleTrigger>{section.title}</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Text size="sm">{section.panel}</Text>
          </CollapsiblePanel>
        </Collapsible>
      ))}
    </Accordion>
  );
}

export const Playground: Story = {
  args: {
    defaultValue: ['delivery'],
    disabled: false,
    headingLevel: '3',
    indicator: 'chevron',
    loop: true,
    mount: 'eager',
    multiple: false,
    requireOpen: false,
    size: 'md',
    togglePlacement: 'end',
    truncate: false,
    variant: 'ruled',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Order {...args} />,
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One at a time, the default"
        note="Opening a section closes the one that was open, and that section is told it closed with the reason select — not because the reader asked it to."
      >
        <Order defaultValue={['delivery']} />
      </Scene>
      <Scene
        label="Several at once"
        note="Every section keeps its own state, so a reader comparing two of them does not have to reopen the first after reading the second."
      >
        <Order defaultValue={['delivery', 'payment']} multiple />
      </Scene>
    </Grid>
  ),
};

export const RequireOpen: Story = {
  parameters: scenario('requireOpen'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A set that may empty"
        note="Pressing the open header closes it and the set shows nothing. It is the right answer where the sections are optional detail rather than the page itself."
      >
        <Order defaultValue={['delivery']} />
      </Scene>
      <Scene
        label="A set that may not"
        note="The one open header carries aria-disabled='true' — the pattern’s own instruction — so it stays focusable and announced while the press does nothing."
      >
        <Order defaultValue={['delivery']} requireOpen />
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="ruled, the default"
        note="One hairline per seam and one under the last item, which the set draws itself so no item has to know whether it is the last."
      >
        <Order defaultValue={['delivery']} />
      </Scene>
      <Scene
        label="framed"
        note="The same ruled set inside one frame. The first item’s own rule is dropped, because two hairlines a pixel apart read as one thick line."
      >
        <Order defaultValue={['delivery']} variant="framed" />
      </Scene>
      <Scene
        label="separated"
        note="A card each, with the set owning only the air between them. It is the arrangement for sections that are not parts of one whole."
      >
        <Order defaultValue={['delivery']} variant="separated" />
      </Scene>
      <Scene
        label="plain"
        note="No chrome at all, for a set inside something that already draws its own edges — a card body, a settings column with its own rules."
      >
        <Order defaultValue={['delivery']} togglePlacement="start" variant="plain" />
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="sm"
        note="The compact step for a set inside a side panel. The gap between cards steps with the type, so the rhythm holds at every size."
      >
        <Order defaultValue={['delivery']} size="sm" variant="separated" />
      </Scene>
      <Scene
        label="md"
        note="The default, and the step a page of sections is usually set at. One word moves every title and every row in the set."
      >
        <Order defaultValue={['delivery']} size="md" variant="separated" />
      </Scene>
      <Scene
        label="lg"
        note="The step for a set that organizes a whole page, where each header is a landmark a reader scans for rather than a row in a list."
      >
        <Order defaultValue={['delivery']} size="lg" variant="separated" />
      </Scene>
    </Grid>
  ),
};

export const Mount: Story = {
  parameters: scenario('mount'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="eager, the default"
        note="Every panel’s content is in the DOM, so each one transitions closed rather than disappearing. Closed panels are inert and out of the accessibility tree."
      >
        <Order defaultValue={['delivery']} />
      </Scene>
      <Scene
        label="lazy, for panels that fetch"
        note="A panel’s content is built the first time it opens and kept afterwards, so arrowing past four sections makes no four requests."
      >
        <Order defaultValue={[]} mount="lazy" />
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The whole set out of action"
        note="disabled reaches every trigger as the native attribute, so the browser refuses each press and no row answers hover — one word for a page under a running job."
      >
        <Order defaultValue={['delivery']} disabled />
      </Scene>
      <Scene
        label="One item out of action inside a live set"
        note="The item states its own disabled and the rest of the set stays operable, which is the case a set-wide attribute cannot express."
      >
        <Accordion defaultValue={['delivery']}>
          <Collapsible value="delivery">
            <CollapsibleHeader>
              <CollapsibleTrigger>Delivery</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Text size="sm">Prevista para 12 de setembro.</Text>
            </CollapsiblePanel>
          </Collapsible>
          <Collapsible disabled value="nota">
            <CollapsibleHeader>
              <CollapsibleTrigger description="not issued yet">Invoice</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Text size="sm">Emitida em 3 de setembro.</Text>
            </CollapsiblePanel>
          </Collapsible>
        </Accordion>
      </Scene>
    </Grid>
  ),
};

export const Imperative: Story = {
  parameters: scenario('imperative'),
  render: () => {
    function Everything() {
      const set = useRef<AccordionHandle>(null);
      return (
        <>
          <Order handle={set} multiple />
          <Button onClick={() => set.current?.openAll()} size="sm" variant="outline">
            Open all
          </Button>
          <Button onClick={() => set.current?.closeAll()} size="sm" variant="outline">
            Close all
          </Button>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="Two moves an array cannot express"
          note="An uncontrolled set has no array for a page to set, so the pair arrives on a handle. Both carry the reason programmatic, and openAll skips a disabled item."
        >
          <Everything />
        </Scene>
        <Scene
          label="The same page, controlled"
          note="A consumer who owns the array needs neither: opening everything is one assignment, and the handle is there for the case where the family owns it instead."
        >
          <ControlledOrder />
        </Scene>
      </Grid>
    );
  },
};

function ControlledOrder() {
  const [value, setValue] = useState<readonly string[]>(['delivery']);
  return (
    <>
      <Order multiple onValueChange={setValue} value={value} />
      <Button
        onClick={() => setValue(SECTIONS.map((section) => section.value))}
        size="sm"
        variant="outline"
      >
        Open all
      </Button>
      <Text size="sm" tone="muted">
        value: {value.join(', ') || '—'}
      </Text>
    </>
  );
}

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="A set inside a panel"
        note="The inner set stays closed while the outer one is open, and its headers stay out of the outer arrow ring — a nested accordion is two accordions, not one."
      >
        <Accordion defaultValue={['externo']} variant="framed">
          <Collapsible value="externo">
            <CollapsibleHeader>
              <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Accordion variant="plain">
                <Collapsible value="http">
                  <CollapsibleHeader>
                    <CollapsibleTrigger>HTTP headers</CollapsibleTrigger>
                  </CollapsibleHeader>
                  <CollapsiblePanel>
                    <Text size="sm">The inner panel stays closed.</Text>
                  </CollapsiblePanel>
                </Collapsible>
              </Accordion>
            </CollapsiblePanel>
          </Collapsible>
        </Accordion>
      </Scene>
      <Scene
        label="Titles longer than their rows"
        note="Each row grows and the marks stay in their own column, so a set of long headings still reads as a column of rows rather than a column of paragraphs."
      >
        <Measure>
          <Order
            sections={[
              {
                panel: 'Thirty calendar days.',
                title: 'Return conditions for international orders',
                value: 'devolucao',
              },
              {
                panel: 'One per order.',
                title: 'Exchanges for manufacturing defects',
                value: 'trocas',
              },
            ]}
          />
        </Measure>
      </Scene>
      <Scene
        label="Nothing to show"
        note="A set with no items renders the box and nothing else. The message a page shows in its place is result-state’s, composed here rather than invented twice."
      >
        <Accordion variant="ruled">
          <Text size="sm" tone="muted">
            No sections for this order.
          </Text>
        </Accordion>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Ten decisions an application takes once"
        note="The provider carries them for every set under it, and one that states any itself still wins — a ruled set inside a separated application stays ruled."
      >
        <AccordionDefaultsProvider multiple size="sm" variant="separated">
          <Order defaultValue={['delivery']} />
        </AccordionDefaultsProvider>
      </Scene>
      <Scene
        label="The set, and the item beside it"
        note="Each item is a Collapsible with its own props, so one section may carry a summary line or a different mark while the set keeps the rest of the decisions."
      >
        <Accordion defaultValue={['delivery']} variant="separated">
          <Collapsible value="delivery">
            <CollapsibleHeader>
              <CollapsibleTrigger description="3 of 12 items">Delivery</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Text size="sm">Prevista para 12 de setembro.</Text>
            </CollapsiblePanel>
          </Collapsible>
          <Collapsible indicator="plus-minus" value="payment">
            <CollapsibleHeader>
              <CollapsibleTrigger>Payment</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Text size="sm">Credit card, approved.</Text>
            </CollapsiblePanel>
          </Collapsible>
        </Accordion>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    function Reasons() {
      const [reason, setReason] = useState('—');
      return (
        <>
          <Order
            defaultValue={['delivery']}
            onValueChange={(_v, request) => setReason(request.reason)}
          />
          <Text size="sm" tone="muted">
            reason: {reason}
          </Text>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="Every header is a tab stop"
          note="Tab walks the set one header at a time, which is what the pattern requires; the arrows, Home and End move focus on top of that and open nothing."
        >
          <Order defaultValue={['delivery']} />
        </Scene>
        <Scene
          label="Which device asked"
          note="A click synthesised by Enter or Space reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener."
        >
          <Reasons />
        </Scene>
      </Grid>
    );
  },
};
