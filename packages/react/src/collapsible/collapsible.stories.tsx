import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Grid, Measure, Scene } from '../field/field-demo';
import { Skeleton } from '../skeleton';
import { Toolbar } from '../toolbar';
import { Text } from '../typography';
import { Collapsible } from './collapsible';
import { CollapsibleDefaultsProvider } from './collapsible-defaults';
import {
  CollapsibleActions,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from './collapsible-parts';
import { REACT_COLLAPSIBLE_DOCS, REACT_COLLAPSIBLE_TOKENS } from './collapsible.docs';
import type { CollapsibleProps } from './collapsible.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_COLLAPSIBLE_DOCS.collapsible.scenes, {
    playground: Playground,
    variant: Variant,
    sizes: Sizes,
    indicator: Indicator,
    heading: Heading,
    description: Description,
    actions: Actions,
    mount: Mount,
    states: States,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Collapsible',
        description:
          'One disclosure: a header the reader operates and a panel it controls. The platform’s own keyboard, a panel that opens to its own height without being measured, and a page search that opens what it found.',
        framework: 'React',
        ...REACT_COLLAPSIBLE_DOCS.collapsible,
        tokens: REACT_COLLAPSIBLE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

function Address({ title = 'Delivery address', ...props }: Partial<CollapsibleProps>) {
  return (
    <Collapsible {...props}>
      <CollapsibleHeader>
        <CollapsibleTrigger>{title}</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>
        <Text size="sm">Rua das Laranjeiras, 402 — Rio de Janeiro.</Text>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export const Playground: Story = {
  args: {
    defaultOpen: true,
    disabled: false,
    indicator: 'chevron',
    level: 'none',
    loading: false,
    mount: 'eager',
    size: 'md',
    togglePlacement: 'end',
    truncate: false,
    variant: 'plain',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => <Address {...args} />,
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="plain"
        note="No chrome at all: the words, the mark and the panel, with nothing drawn around them. It is the disclosure that sits inside a paragraph of settings."
      >
        <Address defaultOpen variant="plain" title="Payment methods" />
      </Scene>
      <Scene
        label="ruled"
        note="A hairline above the header. It is what makes a stack of them read as one list, and the set below closes the stack with a rule of its own."
      >
        <Address defaultOpen variant="ruled" title="Payment methods" />
      </Scene>
      <Scene
        label="framed"
        note="Its own card: a border, a radius and a raised surface, with the hover fill clipped to the corner the frame drew."
      >
        <Address defaultOpen variant="framed" title="Payment methods" />
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
        note="The compact step, for a disclosure inside a card or above a dense table. The title stays larger than a control label, because it is a heading."
      >
        <Summary size="sm" />
      </Scene>
      <Scene
        label="md"
        note="The default. Title on the type scale, row height and padding on the control scales, so switching the toolbar to dense tightens it rather than shrinking it."
      >
        <Summary size="md" />
      </Scene>
      <Scene
        label="lg"
        note="The step for a section header a page is organized by. The second line steps with it, so the pair keeps its relationship at every size."
      >
        <Summary size="lg" />
      </Scene>
    </Grid>
  ),
};

function Summary(props: Partial<CollapsibleProps>) {
  return (
    <Collapsible defaultOpen variant="framed" {...props}>
      <CollapsibleHeader>
        <CollapsibleTrigger description="3 de 12 itens">Resumo</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>
        <Text size="sm">Delivery scheduled for September 12.</Text>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The chevron turns"
        note="Down when closed and up when open, so the same artwork is right in a right-to-left document — nothing is mirrored, because nothing points along the inline axis."
      >
        <Address title="Invoice" variant="ruled" />
        <Address defaultOpen title="Invoice" variant="ruled" />
      </Scene>
      <Scene
        label="plus-minus, and the start edge"
        note="One pair drawn on one grid: the same bar, with a second crossing it. At the start edge the panel’s text is indented to line up with the title rather than with the mark."
      >
        <Address indicator="plus-minus" title="Invoice" variant="ruled" />
        <Address
          defaultOpen
          indicator="chevron"
          title="Invoice"
          togglePlacement="start"
          variant="ruled"
        />
        <Address indicator="none" title="Invoice, no mark" variant="ruled" />
      </Scene>
    </Grid>
  ),
};

export const Heading: Story = {
  parameters: scenario('heading'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="level='none', the default"
        note="A div and no heading semantics, for a disclosure that belongs to no outline — a filter panel, a set of advanced options inside a form."
      >
        <Address title="Advanced options" variant="framed" />
      </Scene>
      <Scene
        label="level='3'"
        note="A real h3 around the trigger, so a screen reader’s heading list holds the section at the right depth. The trigger is its only element, which the pattern requires."
      >
        <Address level="3" title="Return conditions" variant="framed" />
      </Scene>
    </Grid>
  ),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A summary that stays visible"
        note="The second line is inside the trigger, so a reader hears “Regras de frete, 2 regras ativas” as one name rather than meeting two controls."
      >
        <Collapsible variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger description="2 regras ativas">Regras de frete</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Text size="sm">Free shipping over $250.00 for the Southeast region.</Text>
          </CollapsiblePanel>
        </Collapsible>
      </Scene>
      <Scene
        label="The same pair, open"
        note="The mark is centerd on the two lines rather than on the title alone, so the row reads as one block whatever the second line says."
      >
        <Collapsible defaultOpen variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger description="2 regras ativas">Regras de frete</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Text size="sm">Free shipping over $250.00 for the Southeast region.</Text>
          </CollapsiblePanel>
        </Collapsible>
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A toolbar on the header’s row"
        note="Outside the button and outside the heading, because the pattern requires the trigger to be the only element in it — and a control inside a button is invalid besides."
      >
        <Collapsible defaultOpen variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger description="2 regras ativas">Regras de frete</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsibleActions>
            <Toolbar aria-label="Rule actions" size="sm">
              <Button size="sm" variant="ghost">
                Edit
              </Button>
              <Button size="sm" variant="ghost">
                Duplicar
              </Button>
            </Toolbar>
          </CollapsibleActions>
          <CollapsiblePanel>
            <Text size="sm">Free shipping over $250.00 for the Southeast region.</Text>
          </CollapsiblePanel>
        </Collapsible>
      </Scene>
      <Scene
        label="The same set below 22rem"
        note="The family answers its own inline size: the actions leave the header’s row and take one of their own, and the panel moves down with them."
      >
        <Measure>
          <Collapsible defaultOpen variant="framed">
            <CollapsibleHeader>
              <CollapsibleTrigger description="2 regras ativas">Regras de frete</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsibleActions>
              <Toolbar aria-label="Rule actions, narrow" size="sm">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </Toolbar>
            </CollapsibleActions>
            <CollapsiblePanel>
              <Text size="sm">Free shipping over $250.00.</Text>
            </CollapsiblePanel>
          </Collapsible>
        </Measure>
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
        note="The content is in the DOM from the start, which is what lets the panel transition closed rather than disappearing. It is inert and out of the accessibility tree while closed."
      >
        <Address mount="eager" title="Delivery history" variant="framed" />
      </Scene>
      <Scene
        label="until-found, for a page a reader searches"
        note="The panel carries hidden='until-found', so the browser’s own find-in-page reaches the text inside a closed panel and opens it. Search this page for “Ribeiro”."
      >
        <Collapsible mount="until-found" variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>Delivery history</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Text size="sm">Delivered on September 2 by Anna Rivers.</Text>
          </CollapsiblePanel>
        </Collapsible>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Hover and press"
        note="Hover lays a wash under the whole row and press goes one step further, so the target is the row rather than the words inside it."
      >
        <Address title="Hover here" variant="ruled" />
        <Address defaultOpen title="And here, with the panel open" variant="ruled" />
      </Scene>
      <Scene
        label="disabled"
        note="The native attribute on the trigger, so the browser refuses the press and the row answers neither hover nor active. The words stay legible rather than merely faded."
      >
        <Address disabled title="Delivery address" variant="ruled" />
      </Scene>
      <Scene
        label="loading"
        note="The panel keeps a line’s height and says aria-busy, so the reader is not handed an empty frame. What stands in for the content is Skeleton, composed here."
      >
        <Collapsible defaultOpen loading mount="lazy" variant="ruled">
          <CollapsibleHeader>
            <CollapsibleTrigger>Delivery history</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Skeleton shape="text" />
          </CollapsiblePanel>
        </Collapsible>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="A title longer than its row"
        note="The row grows and the mark keeps its own column, so the words never push the chevron off the line. Carbon truncates instead; here that is a word a consumer says."
      >
        <Measure>
          <Address
            title="Return conditions for international orders with an invoice issued abroad"
            variant="ruled"
          />
        </Measure>
      </Scene>
      <Scene
        label="The same title, truncated"
        note="Clipped to one line with an ellipsis, and the whole string still in the DOM — the library decided once that truncation never removes content from it."
      >
        <Measure>
          <Address
            title="Return conditions for international orders with an invoice issued abroad"
            truncate
            variant="ruled"
          />
        </Measure>
      </Scene>
      <Scene
        label="An unbroken token, and another script"
        note="A digest breaks inside itself rather than setting the width of the row, and a right-to-left title is isolated from the row without taking the alignment from the page."
      >
        <Measure>
          <Address title="a3f9c1e77b04d2a6f8e5c30b19d7a4f2c6b8e0d1" variant="ruled" />
          <Address title="تفاصيل الشحن الدولي" variant="ruled" />
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Seven decisions an application takes once"
        note="The provider carries them for every disclosure under it, and one that states any itself still wins — a framed set inside a plain application stays framed."
      >
        <CollapsibleDefaultsProvider size="sm" variant="framed">
          <Address defaultOpen title="Payment methods" />
        </CollapsibleDefaultsProvider>
      </Scene>
      <Scene
        label="One inside another’s panel"
        note="The inner disclosure stays closed while the outer one is open, because every rule the family owns reaches its parts as a child rather than a descendant."
      >
        <Collapsible defaultOpen variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>Advanced settings</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>
            <Address size="sm" title="HTTP headers" variant="ruled" />
          </CollapsiblePanel>
        </Collapsible>
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
          <Collapsible onOpenChange={(_open, request) => setReason(request.reason)} variant="ruled">
            <CollapsibleHeader>
              <CollapsibleTrigger>Click, then use Enter or Space</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>
              <Text size="sm">The reason changes with the device.</Text>
            </CollapsiblePanel>
          </Collapsible>
          <Text size="sm" tone="muted">
            reason: {reason}
          </Text>
        </>
      );
    }

    return (
      <Grid columns={2}>
        <Scene
          label="One ordinary tab stop"
          note="Tab reaches the trigger like any other button and Enter or Space toggles it, because the control is a button and the family binds no key at all."
        >
          <Address title="Delivery address" variant="ruled" />
          <Address title="Payment methods" variant="ruled" />
        </Scene>
        <Scene
          label="Which device asked"
          note="A click synthesised by the keyboard reports no detail and a real one reports the click count, which is how the reason is recovered without a key listener."
        >
          <Reasons />
        </Scene>
      </Grid>
    );
  },
};
