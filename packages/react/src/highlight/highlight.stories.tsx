import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { matchRanges } from '@slotted/core/highlight';

import { Button } from '../button';
import { Text } from '../typography';
import { Highlight } from './highlight';
import { HighlightDefaultsProvider } from './highlight-defaults';
import { REACT_HIGHLIGHT_DOCS, REACT_HIGHLIGHT_TOKENS } from './highlight.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_HIGHLIGHT_DOCS.highlight.scenes, {
    playground: Playground,
    query: Query,
    multiple: Multiple,
    occurrences: Occurrences,
    ranges: Ranges,
    matcher: Matcher,
    current: Current,
    states: States,
    context: Context,
    content: Content,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Highlight',
  component: Highlight,
  // language: pt-BR
  args: { text: 'Açaí Valley Ltd.', query: 'aca' },
  // language: en-US
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Highlight',
        description:
          'The spans of a text a query found, marked in the element the platform defines for it, from the same collator the filter used.',
        framework: 'React',
        ...REACT_HIGHLIGHT_DOCS.highlight,
        tokens: REACT_HIGHLIGHT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

function Scene({
  children,
  label,
  layout = 'stack',
  note,
}: {
  children: ReactNode;
  label: string;
  layout?: 'row' | 'stack' | 'block' | 'prose';
  note: ReactNode;
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

/** One row of a supplier search: the name marked, the detail beside it. */
function Result({
  detail,
  disabled = false,
  name,
  query,
}: {
  detail: string;
  disabled?: boolean;
  name: string;
  query: string;
}) {
  return (
    <div {...(disabled ? { 'data-disabled': '' } : {})}>
      <Text weight="medium" {...(disabled ? { tone: 'muted' } : {})}>
        <Highlight query={query} text={name} />
      </Text>
      <Text size="sm" tone="muted">
        {' · '}
        <Highlight query={query} text={detail} />
      </Text>
    </div>
  );
}

const CLAUSE =
  'The supplier will deliver the materials by the agreed deadline. If the supplier fails to meet the deadline, the contractor will notify the supplier in writing, and the supplier will have five business days to regularize the delivery before the supplier is considered in default.';

export const Playground: Story = {
  args: {
    // language: pt-BR
    text: 'Açaí Valley Ltd.',
    // language: en-US
    query: 'aca',
    occurrences: 'all',
    sensitivity: 'base',
    disabled: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="prose">
      <Text>
        <Highlight {...args} />
      </Text>
    </div>
  ),
};

export const Query: Story = {
  parameters: scenario('query'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Diacritics and case are one letter"
        // language: pt-BR
        note="Intl.Collator at base sensitivity: aca finds Açaí, RESUME finds Résumé. The same comparison the filters and typeahead make, so a row that passed the filter shows the span the filter found."
        // language: en-US
      >
        <Text>
          {/* language: pt-BR */}
          <Highlight query="aca" text="Açaí Valley Ltd." />
          {/* language: en-US */}
        </Text>
        <Text>
          <Highlight query="RESUME" text="Résumé Editorial Services" />
        </Text>
        <Text>
          <Highlight query="strasse" text="Lieferant Hauptstraße 12, Berlin" />
        </Text>
      </Scene>
      <Scene
        label="A query is text, never a pattern"
        note="C++, a.b and (ltda) match themselves. Nothing is a regular expression, so a reader typing punctuation gets the punctuation."
      >
        <Text>
          <Highlight query="c++" text="C++ Consultoria em Sistemas" />
        </Text>
        <Text>
          <Highlight query="a.b" text="Registro a.b.c-2026" />
        </Text>
        <Text>
          <Highlight query="(ltd)" text="Green Valley (Ltd) Farming" />
        </Text>
      </Scene>
    </div>
  ),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Every query is marked"
        note="An array marks each of its entries; empty and whitespace-only entries are dropped before anything is looked for."
      >
        <Text>
          <Highlight query={['sale', '0441']} text="Sale ticket no 2026-0441 — Banana Brazil" />
        </Text>
        <Text>
          <Highlight query={['cabo', '', '  ', 'rede']} text="Cabo de rede Cat6, 305 m" />
        </Text>
      </Scene>
      <Scene
        label="Overlapping queries become one run"
        note="an and na over banana touch and overlap; the result is one mark over anana, never a mark inside a mark and never two that touch."
      >
        <Text>
          <Highlight query={['an', 'na']} text="Banana Brasil Alimentos" />
        </Text>
        <Text>
          <Highlight query={['sup', 'pli', 'er']} text="Supplier approved" />
        </Text>
      </Scene>
    </div>
  ),
};

export const Occurrences: Story = {
  parameters: scenario('occurrences'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="all — the default"
        note="Every place the query appears is marked, which is what a reader scanning a long label for it expects."
      >
        <Text>
          <Highlight query="an" text="Ana Banana Santana" />
        </Text>
        <Text>
          <Highlight query="re" text="Receipt and refund of freight" />
        </Text>
      </Scene>
      <Scene
        label="first"
        note="One span per query, for a list that reads the mark as “why this row is here” and wants the label quiet after it."
      >
        <Text>
          <Highlight occurrences="first" query="an" text="Ana Banana Santana" />
        </Text>
        <Text>
          <Highlight occurrences="first" query="re" text="Receipt and refund of freight" />
        </Text>
      </Scene>
    </div>
  ),
};

export const Ranges: Story = {
  parameters: scenario('ranges'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Spans a search engine returned"
        note="ranges wins over query: the marks are the indexes the server sent, in the text’s own code units, so a fuzzy engine’s answer is drawn without being matched again."
      >
        <Text>
          <Highlight ranges={[[11, 21]]} text="Contractor authorized in 2024" />
        </Text>
        <Text>
          <Highlight
            query="ignored"
            ranges={[
              [0, 4],
              [15, 24],
            ]}
            text="Sale ticket no 2026-0441"
          />
        </Text>
      </Scene>
      <Scene
        label="A malformed span degrades, never throws"
        note="Past the end is clipped, inverted is turned round, inside a flag is widened to the whole character, and overlapping spans merge. A stale bookmark paints no mark rather than an error."
      >
        <Text>
          <Highlight
            ranges={[
              [1, 2],
              [12, 40],
            ]}
            text="🇧🇷 Brazil Cables and Wires"
          />
        </Text>
        <Text>
          <Highlight
            ranges={[
              [9, 4],
              [6, 12],
            ]}
            text="Blueberry Logistics"
          />
        </Text>
      </Scene>
    </div>
  ),
};

function boundary(text: string, at: number) {
  const around = text.slice(Math.max(0, at - 1), at + 1);
  return at === 0 || at === text.length || /\W/.test(around);
}
function wholeWords(text: string, queries: readonly string[]) {
  const inside = ([start, end]: readonly [number, number]) =>
    boundary(text, start) && boundary(text, end);
  return matchRanges(text, queries).filter(inside);
}

export const Matcher: Story = {
  parameters: scenario('matcher'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The default matcher"
        note="cabo finds the word and the start of cabos, because the collator scan looks for the query anywhere."
      >
        <Text>
          <Highlight query="cable" text="Steel cable and network cables" />
        </Text>
      </Scene>
      <Scene
        label="Whole words only, written by the consumer"
        note="matcher receives the queries trimmed of empties and returns ranges; here it keeps only the spans that start and end at a word boundary. Its result is normalized like any other."
      >
        <Text>
          <Highlight matcher={wholeWords} query="cable" text="Steel cable and network cables" />
        </Text>
      </Scene>
    </div>
  ),
};

function FindBar() {
  const root = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(1);
  const total = matchRanges(CLAUSE, 'supplier').length;
  const move = (step: number) => {
    const next = (current + step + total) % total;
    setCurrent(next);
    const marks = root.current?.querySelectorAll('[data-part="match"]');
    marks?.[next]?.scrollIntoView({ block: 'nearest' });
  };
  return (
    <>
      <div className="slotted-demo-row">
        <Text numeric="tabular" size="sm" tone="muted">
          {current + 1} of {total}
        </Text>
        <Button onClick={() => move(-1)} size="sm" variant="outline">
          Previous
        </Button>
        <Button onClick={() => move(1)} size="sm" variant="outline">
          Next
        </Button>
      </div>
      <Text>
        <Highlight current={current} query="supplier" ref={root} text={CLAUSE} />
      </Text>
    </>
  );
}

export const Current: Story = {
  parameters: scenario('current'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A find bar over a clause"
        note="current names one match by index and that mark takes the accent’s solid ground and ink. The buttons move it and scroll to it through the ref; the family itself has no keyboard."
      >
        <FindBar />
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="3">
      <Scene
        label="Default and current"
        note="The band is the accent text tone at the foundation’s share, with a rule under it; the current match is the solid pair."
      >
        <Text>
          <Highlight query="berr" text="Blueberry Logistics" />
        </Text>
        <Text>
          <Highlight current={0} query="berr" text="Blueberry Logistics" />
        </Text>
      </Scene>
      <Scene
        label="Disabled on the root"
        note="The marks give up the tone and keep the rule: the reader still sees which span matched on the one option they cannot take."
      >
        <Text tone="muted">
          <Highlight disabled query="berr" text="Cloudberry Logistics" />
        </Text>
        <Text tone="muted">
          <Highlight current={0} disabled query="berr" text="Cloudberry Logistics" />
        </Text>
      </Scene>
      <Scene
        label="Disabled from the row above"
        note="A host’s option already carries data-disabled, and the family reads it from any ancestor, so the row says it once."
      >
        <div data-disabled>
          <Text tone="muted">
            <Highlight query="berr" text="Gooseberry Transportes" />
          </Text>
        </div>
      </Scene>
    </div>
  ),
};

export const Context: Story = {
  parameters: scenario('context'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A supplier search, results for “aca”"
        note="What combobox, select, multi-select and command-palette render: one root inside each label, the host owning the row, the keyboard and the count. The unavailable supplier keeps its rule and loses its tone."
      >
        {/* language: pt-BR */}
        <Result detail="Food · Bellevue, WA" name="Açaí Valley Ltd." query="aca" />
        {/* language: en-US */}
        <Result detail="Finishes · Tacoma, WA" name="Acadia Coatings" query="aca" />
        <Result detail="Packaging · Macon, GA" name="Macadam Packaging" query="aca" />
        <Result detail="Registration suspended" disabled name="Vacaville Dairy" query="aca" />
      </Scene>
      <Scene
        label="One decision for the application"
        note="The provider sets locale, sensitivity and occurrences once for everything below it; a mark that states any of them itself still wins."
      >
        <HighlightDefaultsProvider occurrences="first" sensitivity="accent">
          <Text>
            {/* language: pt-BR */}
            <Highlight query={['re', 'aca']} text="Receipt of açaí and refund" />
            {/* language: en-US */}
          </Text>
          <Text>
            <Highlight
              occurrences="all"
              query={['re', 'aca']}
              sensitivity="base"
              // language: pt-BR
              text="Receipt of açaí and refund"
              // language: en-US
            />
          </Text>
        </HighlightDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="A run that wraps"
        note="Both halves carry the band and the rule: the box is cloned across the break rather than cut at the end of the first line."
      >
        <div className="slotted-demo-measure">
          <Text>
            <Highlight
              query="consolidated annual"
              text="Consolidated annual sales report by supplier"
            />
          </Text>
        </div>
      </Scene>
      <Scene
        label="Right-to-left text"
        note="The indexes are logical, so the mark sits on the same word whichever direction the paragraph runs. Switch direction in the toolbar."
      >
        <Text>
          <Highlight dir="rtl" lang="ar" query="النور" text="شركة النور للتجارة والمقاولات" />
        </Text>
        <Text>
          <Highlight query="النور" text="Supplier: شركة النور للتجارة" />
        </Text>
      </Scene>
      <Scene
        label="Graphemes"
        note="A query inside a flag or a decomposed accent widens to the whole character, so no mark holds half a surrogate pair or an orphaned combining mark."
      >
        <Text>
          <Highlight query={['bra', 'e']} text="🇧🇷 Brasil · Crème" />
        </Text>
      </Scene>
      <Scene
        label="A long label and a one-letter query"
        note="Eight hundred characters and a hundred marks, answered in under a millisecond; a mark per occurrence, with no cap and no reflow."
      >
        <Text size="sm">
          <Highlight query="a" text={`${CLAUSE} ${CLAUSE} ${CLAUSE}`} />
        </Text>
      </Scene>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="The text is the text"
        note="Every run is a slice of the string handed in; nothing is parsed and nothing is hidden. A label holding <b> reads <b>, and the marks are mark elements with no role written over them."
      >
        <Text>
          <Highlight query="<b>" text="Description: <b>bold</b> is not HTML here" />
        </Text>
      </Scene>
      <Scene
        label="No hidden announcement"
        note="mark is not announced by most screen readers by default, and the family adds no hidden “highlight start”: five matches in an option would be ten announcements. The rule is the application’s to write."
      >
        <Text>
          <Highlight query="supplier" text="The supplier notifies the replacement supplier" />
        </Text>
      </Scene>
    </div>
  ),
};
