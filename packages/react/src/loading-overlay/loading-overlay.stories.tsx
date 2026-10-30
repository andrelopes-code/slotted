import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../button';
import { Card, CardBody, CardHeader } from '../card';
import { Field, FieldLabel } from '../field';
import { ProgressBar } from '../progress-indicator';
import { TextField } from '../text-field';
import { Heading, Text } from '../typography';
import { LoadingOverlay } from './loading-overlay';
import { LoadingOverlayDefaultsProvider } from './loading-overlay-defaults';
import { REACT_LOADING_OVERLAY_DOCS, REACT_LOADING_OVERLAY_TOKENS } from './loading-overlay.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_LOADING_OVERLAY_DOCS.loadingOverlay.scenes, {
    playground: Playground,
    region: Region,
    page: Page,
    veil: Veil,
    sizes: Sizes,
    shapes: Shapes,
    timing: Timing,
    cancel: Cancel,
    focus: Focus,
    indicator: Indicator,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Loading overlay',
  component: LoadingOverlay,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Loading overlay',
        description:
          'Content that is already on the page, kept measured and taken out of reach until a wait the consumer owns has ended.',
        framework: 'React',
        ...REACT_LOADING_OVERLAY_DOCS.loadingOverlay,
        tokens: REACT_LOADING_OVERLAY_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'block',
  note,
}: {
  children: React.ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage" data-align="start" data-layout={layout}>
        {children}
      </div>
    </section>
  );
}

/** A wait that never finishes, so a demonstration can be looked at. */
function useForever(interval: number) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setOn((value) => !value), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return on;
}

/** The form every demonstration covers, so one product is on the page. */
function BillingAddress() {
  return (
    <Card>
      <CardHeader>
        <Heading level={3}>Billing address</Heading>
      </CardHeader>
      <CardBody>
        <div className="slotted-demo-stack">
          <Field>
            <FieldLabel>Street</FieldLabel>
            <TextField defaultValue="12 Harbor Street" />
          </Field>
          <Field>
            <FieldLabel>Cidade</FieldLabel>
            <TextField defaultValue="Seattle" />
          </Field>
          <Button variant="solid">Save</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Invoices() {
  return (
    <div className="slotted-demo-rows">
      <span>ACME Ltda.</span>
      <span>R$ 1 240,00</span>
      <span>North Wind Stationery</span>
      <span>$318.90</span>
      <span>Ipe Construction</span>
      <span>$24,700.00</span>
    </div>
  );
}

export const Playground: Story = {
  args: {
    cancellable: false,
    loading: true,
    messages: { label: 'Saving changes' },
    scope: 'region',
    size: 'md',
    veil: 'wash',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-align="start" data-layout="block">
      <LoadingOverlay {...args}>
        <BillingAddress />
      </LoadingOverlay>
    </div>
  ),
};

export const Region: Story = {
  parameters: scenario('region'),
  render: () => (
    <Scene
      label="A card mid-save"
      note="The card keeps its height while it is covered, so nothing below it moves twice per save. Tab from the button above the canvas: the keyboard walks past the covered fields, because they are inert rather than dimmed."
    >
      <div className="slotted-demo-row">
        <Button variant="outline">Focus starts here</Button>
      </div>
      <LoadingOverlay messages={{ label: 'Saving changes' }}>
        <BillingAddress />
      </LoadingOverlay>
      <Text tone="muted">Nothing below the region moves while the wash is up.</Text>
    </Scene>
  ),
};

export const Page: Story = {
  parameters: scenario('page'),
  render: () => {
    function Demo() {
      const [closing, setClosing] = useState(false);
      return (
        <div className="slotted-demo-stack">
          <Button variant="solid" onClick={() => setClosing(true)}>
            Close the period
          </Button>
          <Text tone="muted">
            The layer is portalled, every sibling of the portal root goes inert and the document
            scroll is locked. Press Escape to end this demonstration.
          </Text>
          <LoadingOverlay
            scope="page"
            size="lg"
            loading={closing}
            cancellable
            cancelLabel="Interromper"
            messages={{ label: 'Closing the accounting period' }}
            description="Do not close this tab. The ledger is locked until this finishes."
            onCancel={() => setClosing(false)}
          />
        </div>
      );
    }
    return (
      <Scene
        label="The whole application waits"
        note="Reach for page scope only where partial interaction would be unsafe — a month-end close, not a row that is saving. The guide warns against making a page unreachable for a local operation."
      >
        <Demo />
      </Scene>
    );
  },
};

export const Veil: Story = {
  parameters: scenario('veil'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="wash"
        note="The theme’s own scrim, restated per colour scheme and turned opaque under forced colours. It is the same token dialog and drawer read, so three families dim a surface in one tint."
      >
        <LoadingOverlay veil="wash" messages={{ label: 'Reconciling September' }}>
          <Invoices />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="blur"
        note="The wash and a backdrop filter together. Text under it stops being legible before it stops being visible, which is exactly the message the layer is carrying."
      >
        <LoadingOverlay veil="blur" messages={{ label: 'Reconciling September' }}>
          <Invoices />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="none"
        note="Nothing is dimmed and nothing is reachable: the panel is what says so. It is the form to reach for when the wait is short enough that a wash would read as a flash."
      >
        <LoadingOverlay veil="none" messages={{ label: 'Reconciling September' }}>
          <Invoices />
        </LoadingOverlay>
      </Scene>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      {(
        [
          [
            'sm',
            'The step for a table cell, a metric tile, a row: the mark is the height of a small control and the two lines take the small control type step.',
          ],
          [
            'md',
            'The default, and the step for a card or a panel. A wait beside a medium button is the height of that button, at every density.',
          ],
          [
            'lg',
            'The step for a region that owns the screen — a page-scoped layer, a full-width panel — where a small mark would be lost in the space around it.',
          ],
        ] as const
      ).map(([size, note]) => (
        <Scene key={size} label={size} note={note}>
          <LoadingOverlay
            size={size}
            messages={{ label: 'Reconciling September' }}
            description="1 284 entries"
          >
            <Invoices />
          </LoadingOverlay>
        </Scene>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  parameters: scenario('shapes'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A tall region takes a column"
        note="The mark above the two lines above the control, centred. It is the arrangement for a card, a panel or anything with room to spare in the block axis."
      >
        <LoadingOverlay
          messages={{ label: 'Importing 4 812 rows' }}
          description="About a minute left."
          cancellable
        >
          <BillingAddress />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="A short region takes a bar"
        note="Nothing is dropped: the mark moves beside the text, the two lines stack next to it, and the control goes to the end of the row. Sixty pixels tall carrying what the column carried."
      >
        <LoadingOverlay
          messages={{ label: 'Importing 4 812 rows' }}
          description="About a minute left."
          cancellable
        >
          <Invoices />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="A small region keeps the mark"
        note="Under 220 pixels across, or 88 down, the words go and the panel gives up its ground. They are not lost: the live region holds the same sentence, which is where it was doing the work for the reader who needed it."
        layout="stack"
      >
        <div className="slotted-demo-measure">
          <LoadingOverlay messages={{ label: 'Loading the sparkline' }}>
            <Card>
              <CardBody>
                <Text tone="muted" size="sm">
                  Receita
                </Text>
                <Heading level={3}>R$ 128 400</Heading>
              </CardBody>
            </Card>
          </LoadingOverlay>
        </div>
      </Scene>
    </div>
  ),
};

export const Timing: Story = {
  parameters: scenario('timing'),
  render: () => {
    function Demo() {
      const pending = useForever(900);
      return (
        <div className="slotted-demo-stack">
          <Text tone="muted">Neither duration set — the layer paints on every flip.</Text>
          <LoadingOverlay loading={pending} messages={{ label: 'Reconciling September' }}>
            <Invoices />
          </LoadingOverlay>
          <Text tone="muted">
            delay 600, minDuration 600 — the same flips, and nothing flashes.
          </Text>
          <LoadingOverlay
            loading={pending}
            delay={600}
            minDuration={600}
            messages={{ label: 'Reconciling September' }}
          >
            <Invoices />
          </LoadingOverlay>
        </div>
      );
    }
    return (
      <Scene
        label="Two flashes, and the two durations that prevent them"
        note="A load that finishes every nine hundred milliseconds, so the difference is visible standing still. Both default to zero and cost no timer; set them once for the application through the provider, because latency is a property of the application rather than of one overlay."
      >
        <Demo />
      </Scene>
    );
  },
};

export const Cancel: Story = {
  parameters: scenario('cancel'),
  render: () => {
    function Demo() {
      const [state, setState] = useState<'running' | 'stopping' | 'idle'>('running');
      return (
        <>
          <LoadingOverlay
            loading={state !== 'idle'}
            cancellable
            cancelLabel={state === 'stopping' ? 'Interrompendo…' : 'Interromper'}
            messages={{
              label: state === 'stopping' ? 'Rolling the batch back' : 'Importing 4 812 rows',
            }}
            description={
              state === 'stopping'
                ? 'Nothing has been committed.'
                : 'This usually takes about a minute.'
            }
            onCancel={() => {
              setState('stopping');
              setTimeout(() => setState('idle'), 1200);
            }}
          >
            <Invoices />
          </LoadingOverlay>
          <div className="slotted-demo-row">
            <Button variant="outline" onClick={() => setState('running')}>
              Start the import again
            </Button>
          </div>
        </>
      );
    }
    return (
      <Scene
        label="A wait that has gone wrong"
        note="Press Interromper, or Escape while focus is in the layer. The request carries the reason and the family commits nothing — the label changes because the application changed it, which is the only thing that knows the work has stopped."
      >
        <Demo />
      </Scene>
    );
  },
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => {
    function Demo() {
      const [saving, setSaving] = useState(false);
      const field = useRef<HTMLInputElement>(null);
      return (
        <div className="slotted-demo-stack">
          <LoadingOverlay
            loading={saving}
            cancellable
            minDuration={1600}
            messages={{ label: 'Saving changes' }}
            onCancel={() => setSaving(false)}
            onReveal={() => field.current?.focus()}
          >
            <Card>
              <CardBody>
                <div className="slotted-demo-stack">
                  <Field>
                    <FieldLabel>Street</FieldLabel>
                    <TextField defaultValue="12 Harbor Street" ref={field} />
                  </Field>
                  <Button variant="solid" onClick={() => setSaving(true)}>
                    Save
                  </Button>
                </div>
              </CardBody>
            </Card>
          </LoadingOverlay>
          <Text tone="muted">
            Put the caret in the field, then press Save with the keyboard. Focus was inside content
            that is about to go inert, so it moves into the panel and comes back when the wait ends.
          </Text>
        </div>
      );
    }
    return (
      <Scene
        label="Where the keyboard goes"
        note="Making an element inert while it holds focus drops focus to the body. None of the surveyed implementations has the defect because none of them makes anything inert; this one does, so it owns both halves of the move."
      >
        <Demo />
      </Scene>
    );
  },
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => (
    <Scene
      label="A wait with a number on it"
      note="The mark is a slot and the default is the contained loader. A determinate wait passes progress-indicator’s own ProgressBar, and the family that owns a measured quantity draws it — this one has no value prop and never will."
    >
      <LoadingOverlay
        messages={{ label: 'Uploading contrato.pdf' }}
        description="2,4 MB of 3,9 MB"
        indicator={<ProgressBar value={62} label="Uploaded" hideLabel />}
      >
        <Invoices />
      </LoadingOverlay>
    </Scene>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="A translated sentence"
        note="Longer than the English one that was measured. The panel wraps it, keeps its own measure, and never truncates — the announcement holds the same sentence whole for the reader who would otherwise lose it."
      >
        <LoadingOverlay
          messages={{
            label: 'Reconciling the period entries against the imported bank statement',
          }}
          description="Stopping now would leave half the period reconciled."
          cancellable
          cancelLabel="Stop"
        >
          <BillingAddress />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="One unbroken token"
        note="A file name with nowhere to break, in a region narrow enough to force the question. It breaks inside the panel rather than pushing the panel past the region it is centred in."
        layout="stack"
      >
        <div className="slotted-demo-measure">
          <LoadingOverlay
            messages={{
              label: 'Uploading conciliacao-bancaria-setembro-2026-consolidado-final.pdf',
            }}
            size="sm"
          >
            <Invoices />
          </LoadingOverlay>
        </div>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="The region is the element the page already has"
        note="render substitutes the root, and every data attribute, the ref and aria-busy are handed to it. Here the region is a section rather than a div."
      >
        <LoadingOverlay
          messages={{ label: 'Reconciling' }}
          render={(props) => <section {...props} />}
        >
          <Invoices />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="The control is the consumer’s own"
        note="renderCancel puts this library’s Button in the slot. The family’s own control paint is written :not([data-ui]), so the Button keeps its own — the part stays the part, and only the paint steps back."
      >
        <LoadingOverlay
          messages={{ label: 'Importing 4 812 rows' }}
          cancellable
          renderCancel={(props) => <Button {...props} variant="outline" size="sm" />}
        >
          <Invoices />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="An application decides once"
        note="The provider sets the veil, the size and the timing below it. An overlay that states any of them still wins, because an explicit prop is never overridden by context."
      >
        <LoadingOverlayDefaultsProvider veil="blur" size="sm">
          <div className="slotted-demo-stack">
            <LoadingOverlay>
              <Invoices />
            </LoadingOverlay>
            <LoadingOverlay veil="wash" messages={{ label: 'This one states its own' }}>
              <Invoices />
            </LoadingOverlay>
          </div>
        </LoadingOverlayDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="One wait, one announcement"
        note='A visually-hidden role="status" holds the label while the layer blocks and is emptied afterwards, because emptying a live region announces nothing. loadedLabel opts into a second message.'
      >
        <LoadingOverlay messages={{ label: 'Saving changes' }} loadedLabel="Changes saved">
          <BillingAddress />
        </LoadingOverlay>
      </Scene>
      <Scene
        label="The wait can also be silent"
        note='live="off" renders no live region at all, for a page that already announces the same wait somewhere else — a route transition that speaks for the whole screen, say.'
      >
        <LoadingOverlay live="off" messages={{ label: 'Saving changes' }}>
          <Invoices />
        </LoadingOverlay>
      </Scene>
    </div>
  ),
};
