import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './link';
import { LinkDefaultsProvider } from './link-defaults';
import { REACT_LINK_DOCS, REACT_LINK_TOKENS } from './link.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_LINK_DOCS.link.scenes, {
    playground: Playground,
    underline: Underline,
    variants: Variants,
    external: External,
    states: States,
    current: Current,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Link',
        description:
          'Navigation inside a sentence, underlined by default and honest about where it goes.',
        framework: 'React',
        ...REACT_LINK_DOCS.link,
        tokens: REACT_LINK_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'row',
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

export const Playground: Story = {
  args: {
    children: 'the terms of service',
    disabled: false,
    external: false,
    underline: 'always',
    variant: 'accent',
    visited: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="prose">
      <p>
        Read <Link {...args} href="/terms" /> before continuing. The sentence is here because a link
        is only ever as legible as the text it sits in.
      </p>
    </div>
  ),
};

export const Underline: Story = {
  parameters: scenario('underline'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      {(
        [
          [
            'always',
            'Prose. The only value that survives a reader who cannot separate the colors.',
          ],
          ['hover', 'Dense navigation, where a column of underlines is noise. Focus reveals it.'],
          ['none', 'A link a heading or a cell already frames as one.'],
        ] as const
      ).map(([underline, note]) => (
        <Scene key={underline} label={`underline="${underline}"`} layout="prose" note={note}>
          <p>
            Charges are listed in the{' '}
            <Link href="/invoices" underline={underline}>
              payment history
            </Link>
            .
          </p>
        </Scene>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label='variant="accent"'
        layout="prose"
        note="The invitation to leave this page. Hover darkens it toward the body color and fills the underline."
      >
        <p>
          Charges are listed in the <Link href="/history">payment history</Link>.
        </p>
      </Scene>
      <Scene
        label='variant="neutral"'
        layout="stack"
        note="The color of the text around it, reaching the accent under the pointer. It belongs where nothing on the line could be mistaken for it."
      >
        <Link href="/invoices/0041" underline="hover" variant="neutral">
          INV-2026-08-0041
        </Link>
        <Link href="/invoices/0038" underline="hover" variant="neutral">
          INV-2026-07-0038
        </Link>
      </Scene>
      <Scene
        label='variant="inverse"'
        layout="stack"
        note="On a solid ground the text color is already the strongest available, so hover is carried by the underline alone."
      >
        <div className="slotted-demo-surface" data-surface="inverse">
          Your trial ends in three days.{' '}
          <Link href="/plans" variant="inverse">
            Choose a plan
          </Link>
        </div>
      </Scene>
    </div>
  ),
};

export const External: Story = {
  parameters: scenario('external'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="external"
        layout="prose"
        note="The marker says it to the eye and the hidden text says it to a screen reader, before the link is followed rather than after."
      >
        <p>
          The full specification lives at{' '}
          <Link external href="https://www.w3.org/TR/wai-aria-1.2/">
            the WAI-ARIA specification
          </Link>
          .
        </p>
        <p>
          The wording is a message, so an application in another language reads{' '}
          <Link
            external
            href="https://www.w3.org/TR/wai-aria-1.2/"
            messages={{ externalHint: '(opens in a new tab)' }}
          >
            a hint of its own
          </Link>
          .
        </p>
      </Scene>
      <Scene
        label='target="_blank"'
        layout="prose"
        note="The warning follows the fact rather than the prop, so an attribute written by hand earns the same marker, the same hidden text and the same safe rel."
      >
        <p>
          Written by hand, and{' '}
          <Link href="https://www.w3.org/TR/wai-aria-1.2/" target="_blank">
            warned about all the same
          </Link>
          .
        </p>
        <p>
          Overruled by hand, and{' '}
          <Link external href="https://www.w3.org/TR/wai-aria-1.2/" target="_self">
            silent, because nothing new opens
          </Link>
          .
        </p>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Available"
        layout="stack"
        note="Hover darkens the text and fills the underline; press goes one step further. Both are worth exercising with the pointer rather than reading here."
      >
        <Link href="/invoices">At rest</Link>
        <Link href="/invoices" visited>
          Followed before, where the application asked for it
        </Link>
      </Scene>
      <Scene
        label="disabled"
        layout="stack"
        note="The destination is gone, which is what stops a middle click too. Tab still reaches it, so the state can be discovered rather than guessed at."
      >
        <Link disabled href="/invoices/0042">
          Unavailable until the invoice is issued
        </Link>
        <Link disabled external href="https://example.com/status">
          Unavailable, and it would have left the application
        </Link>
      </Scene>
    </div>
  ),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label='aria-current="page"'
        layout="stack"
        note="The link to the page you are already on takes the body color and keeps its underline. Nothing about its width changes, so the column does not shift."
      >
        <nav aria-label="Workspace">
          <div className="slotted-demo-stack">
            <Link aria-current="page" href="/invoices" underline="hover">
              Invoices
            </Link>
            <Link href="/members" underline="hover">
              Members
            </Link>
            <Link href="/settings" underline="hover">
              Settings
            </Link>
          </div>
        </nav>
      </Scene>
      <Scene
        label="Inside a sentence"
        layout="prose"
        note="The same attribute in running text: still a link, still underlined, and no longer an invitation to go anywhere."
      >
        <p>
          You are reading the{' '}
          <Link aria-current="page" href="/terms">
            terms of service
          </Link>
          , and the <Link href="/privacy">privacy notice</Link> is next.
        </p>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A destination as the label"
        layout="prose"
        note="One unbroken token. Without overflow-wrap it widens the column it sits in rather than wrapping inside it, which a 240-pixel container shows immediately."
      >
        <div className="slotted-demo-measure">
          <Link href="/reconciliation">
            https://billing.example.com/accounts/8412/invoices/2026-08/reconciliation-report
          </Link>
        </div>
      </Scene>
      <Scene
        label="Translated, and right to left"
        layout="prose"
        note="A German compound wraps mid-word; an Arabic sentence mirrors the marker, and the Latin island inside it does not mirror with it."
      >
        <p>
          Die <Link href="/uebersicht">Zahlungsempfängerverwaltungsübersicht</Link> listet jede
          Rechnung auf.
        </p>
        <p dir="rtl" lang="ar">
          تصدر الفواتير إلى العنوان المسجل في{' '}
          <Link external href="https://example.com/terms">
            موقع الجهة التنظيمية
          </Link>
          .
        </p>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="render"
        layout="stack"
        note="The rendered element is substituted for a router's own link, and the destination and every data attribute go with it — which is what makes prefetching and client-side navigation possible."
      >
        <Link href="/invoices" render={(props) => <a {...props} data-router="" />}>
          Invoices
        </Link>
      </Scene>
      <Scene
        label="LinkDefaultsProvider"
        layout="stack"
        note="One decision for every link below it. The first link inherits hover and neutral; the second states its own and wins."
      >
        <LinkDefaultsProvider underline="hover" variant="neutral">
          <Link href="/invoices">Inherited</Link>
          <Link href="/members" underline="always" variant="accent">
            Stated on the link
          </Link>
        </LinkDefaultsProvider>
      </Scene>
      <Scene
        label="In a dense row"
        layout="stack"
        note="Where the neutral variant earns its place: the name is the link, the type is the row's, and nothing is painted blue until the pointer reaches it."
      >
        <div className="slotted-demo-rows">
          <span>
            <Link href="/invoices/0041" underline="hover" variant="neutral">
              INV-2026-08-0041
            </Link>
          </span>
          <span>Paid</span>
          <span>
            <Link href="/invoices/0038" underline="hover" variant="neutral">
              INV-2026-07-0038
            </Link>
          </span>
          <span>Overdue</span>
        </div>
      </Scene>
      <Scene
        label="Beside an icon"
        layout="stack"
        note="Arbitrary artwork is the consumer's and belongs to the icon family; only the external marker is the link's own, because only the link knows a new tab is opening."
      >
        <Link href="/reports/2026-08.pdf" download>
          Download the August report
        </Link>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="1">
      <Scene
        label="Tab, then Enter"
        layout="stack"
        note="Tab reaches all three, including the unavailable one. Enter follows the link that has a destination; Space does nothing, because Space does not activate a link."
      >
        <Link href="/invoices">A link with a destination</Link>
        <Link external href="https://example.com/status">
          A link that leaves the application
        </Link>
        <Link disabled href="/invoices/0042">
          A link that is unavailable
        </Link>
      </Scene>
    </div>
  ),
};
