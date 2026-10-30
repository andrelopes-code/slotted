import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';
import { Component, ElementRef, inject, signal } from '@angular/core';

import { matchRanges } from '@slotted/core/highlight';

import { SlButton } from '@slotted/angular/button';
import { SlText } from '@slotted/angular/typography';

import { SlHighlight } from './highlight';
import { provideHighlightDefaults } from './highlight-defaults';
import type { HighlightOccurrences, HighlightSensitivity } from './highlight-defaults';
import { ANGULAR_HIGHLIGHT_DOCS, ANGULAR_HIGHLIGHT_TOKENS } from './highlight.docs';

interface HighlightStoryArgs {
  disabled: boolean;
  occurrences: HighlightOccurrences;
  query: string;
  sensitivity: HighlightSensitivity;
  text: string;
}

const CLAUSE =
  'The supplier will deliver the materials by the agreed deadline. If the supplier fails to meet the deadline, the contractor will notify the supplier in writing, and the supplier will have five business days to correct the delivery before the supplier is considered in default.';

function boundary(text: string, at: number) {
  const around = text.slice(Math.max(0, at - 1), at + 1);
  return at === 0 || at === text.length || /\W/.test(around);
}
function wholeWords(text: string, queries: readonly string[]) {
  const inside = ([start, end]: readonly [number, number]) =>
    boundary(text, start) && boundary(text, end);
  return matchRanges(text, queries).filter(inside);
}

/** A find bar over a clause: the buttons move the current match and scroll to it. */
@Component({
  selector: 'sl-highlight-find-bar-demo',
  standalone: true,
  imports: [SlButton, SlHighlight, SlText],
  template: `
    <div class="slotted-demo-row">
      <span slText size="sm" tone="muted" numeric="tabular"
        >{{ current() + 1 }} of {{ total }}</span
      >
      <button slButton size="sm" variant="outline" (click)="move(-1)">Previous</button>
      <button slButton size="sm" variant="outline" (click)="move(1)">Next</button>
    </div>
    <p slText>
      <span slHighlight [text]="clause" query="supplier" [current]="current()"></span>
    </p>
  `,
})
class FindBarDemo {
  readonly clause = CLAUSE;
  readonly total = matchRanges(CLAUSE, 'supplier').length;
  readonly current = signal(1);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  move(step: number) {
    const next = (this.current() + step + this.total) % this.total;
    this.current.set(next);
    const marks = this.host.nativeElement.querySelectorAll('[data-part="match"]');
    marks[next]?.scrollIntoView({ block: 'nearest' });
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_HIGHLIGHT_DOCS.highlight.scenes, {
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

const meta: Meta<HighlightStoryArgs> = {
  title: 'Components/Highlight',
  component: SlHighlight,
  decorators: [moduleMetadata({ imports: [FindBarDemo, SlHighlight, SlText] })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Highlight',
        description:
          'The spans of a text a query found, marked in the element the platform defines for it, from the same collator the filter used.',
        framework: 'Angular',
        ...ANGULAR_HIGHLIGHT_DOCS.highlight,
        tokens: ANGULAR_HIGHLIGHT_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<HighlightStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes
 * this rather than laying itself out, so no two examples can end up against
 * each other and no story reaches for an inline style.
 */
const scene = (
  label: string,
  note: string,
  body: string,
  layout: 'row' | 'stack' | 'block' | 'prose' = 'stack',
) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-align="start" data-layout="${layout}">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

const line = (inner: string, attributes = '') => `<p slText${attributes}>${inner}</p>`;
const mark = (attributes: string) => `<span slHighlight ${attributes}></span>`;

/** One row of a supplier search: the name marked, the detail beside it. */
const result = (name: string, detail: string, query: string, disabled = false) =>
  `<div${disabled ? ' data-disabled' : ''}>` +
  `<span slText weight="medium"${disabled ? ' tone="muted"' : ''}>${mark(`text="${name}" query="${query}"`)}</span>` +
  `<span slText size="sm" tone="muted"> · ${mark(`text="${detail}" query="${query}"`)}</span>` +
  `</div>`;

export const Playground: Story = {
  args: {
    disabled: false,
    occurrences: 'all',
    query: 'aca',
    sensitivity: 'base',
    // language: pt-BR
    text: 'Açaí do Vale Ltda.',
    // language: en-US
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="prose">
        <p slText><span slHighlight [text]="text" [query]="query" [occurrences]="occurrences" [sensitivity]="sensitivity" [disabled]="disabled"></span></p>
      </div>`,
  }),
};

export const Query: Story = {
  parameters: scenario('query'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Diacritics and case are one letter',
        // language: pt-BR
        'Intl.Collator at base sensitivity: aca finds Açaí, RESUME finds Résumé. The same comparison the filters and typeahead make, so a row that passed the filter shows the span the filter found.',
        line(mark('text="Açaí do Vale Ltda." query="aca"')) +
          // language: en-US
          line(mark('text="Résumé Editorial Services" query="RESUME"')) +
          line(mark('text="Lieferant Hauptstraße 12, Berlin" query="strasse"')),
      ) +
        scene(
          'A query is text, never a pattern',
          'C++, a.b and (ltda) match themselves. Nothing is a regular expression, so a reader typing punctuation gets the punctuation.',
          line(mark('text="C++ Systems Consulting" query="c++"')) +
            line(mark('text="Record a.b.c-2026" query="a.b"')) +
            line(mark('text="Green Valley (Ltd) Agriculture" query="(ltd)"')),
        ),
    ),
  }),
};

export const Multiple: Story = {
  parameters: scenario('multiple'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Every query is marked',
        'An array marks each of its entries; empty and whitespace-only entries are dropped before anything is looked for.',
        line(mark(`text="Invoice no. 2026-0441 — Banana Brazil" [query]="['invoice', '0441']"`)) +
          line(mark(`text="Cat6 network cable, 305 m" [query]="['cable', '', '  ', 'network']"`)),
      ) +
        scene(
          'Overlapping queries become one run',
          'an and na over banana touch and overlap; the result is one mark over anana, never a mark inside a mark and never two that touch.',
          line(mark(`text="Banana Brazil Foods" [query]="['an', 'na']"`)) +
            line(mark(`text="Supplier certified" [query]="['sup', 'pli', 'er']"`)),
        ),
    ),
  }),
};

export const Occurrences: Story = {
  parameters: scenario('occurrences'),
  render: () => ({
    template: grid(
      2,
      scene(
        'all — the default',
        'Every place the query appears is marked, which is what a reader scanning a long label for it expects.',
        line(mark('text="Ana Banana Santana" query="an"')) +
          line(mark('text="Receipt and refund of freight" query="re"')),
      ) +
        scene(
          'first',
          'One span per query, for a list that reads the mark as “why this row is here” and wants the label quiet after it.',
          line(mark('text="Ana Banana Santana" query="an" occurrences="first"')) +
            line(mark('text="Receipt and refund of freight" query="re" occurrences="first"')),
        ),
    ),
  }),
};

export const Ranges: Story = {
  parameters: scenario('ranges'),
  render: () => ({
    template: grid(
      2,
      scene(
        'Spans a search engine returned',
        'ranges wins over query: the marks are the indexes the server sent, in the text’s own code units, so a fuzzy engine’s answer is drawn without being matched again.',
        line(mark('text="Supplier certified in 2024" [ranges]="[[9, 18]]"')) +
          line(mark('text="Invoice no. 2026-0441" query="ignored" [ranges]="[[0, 7], [12, 21]]"')),
      ) +
        scene(
          'A malformed span degrades, never throws',
          'Past the end is clipped, inverted is turned round, inside a flag is widened to the whole character, and overlapping spans merge. A stale bookmark paints no mark rather than an error.',
          line(mark('text="🇧🇷 Brazil Cables and Connections" [ranges]="[[1, 2], [12, 40]]"')) +
            line(mark('text="Blueberry Logistics" [ranges]="[[9, 4], [6, 12]]"')),
        ),
    ),
  }),
};

export const Matcher: Story = {
  parameters: scenario('matcher'),
  render: () => ({
    props: { wholeWords },
    template: grid(
      2,
      scene(
        'The default matcher',
        'cable finds the word and the start of cables, because the collator scan looks for the query anywhere.',
        line(mark('text="Steel cable and network cables" query="cable"')),
      ) +
        scene(
          'Whole words only, written by the consumer',
          'matcher receives the queries trimmed of empties and returns ranges; here it keeps only the spans that start and end at a word boundary. Its result is normalised like any other.',
          line(mark('text="Steel cable and network cables" query="cable" [matcher]="wholeWords"')),
        ),
    ),
  }),
};

export const Current: Story = {
  parameters: scenario('current'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A find bar over a clause',
        'current names one match by index and that mark takes the accent’s solid ground and ink. The buttons move it and scroll to it through the element; the family itself has no keyboard.',
        '<sl-highlight-find-bar-demo></sl-highlight-find-bar-demo>',
      ),
    ),
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: grid(
      3,
      scene(
        'Default and current',
        'The band is the accent text tone at the foundation’s share, with a rule under it; the current match is the solid pair.',
        line(mark('text="Blueberry Logistics" query="berr"')) +
          line(mark('text="Blueberry Logistics" query="berr" [current]="0"')),
      ) +
        scene(
          'Disabled on the root',
          'The marks give up the tone and keep the rule: the reader still sees which span matched on the one option they cannot take.',
          line(mark('text="Cloudberry Logistics" query="berr" disabled'), ' tone="muted"') +
            line(
              mark('text="Cloudberry Logistics" query="berr" [current]="0" disabled'),
              ' tone="muted"',
            ),
        ) +
        scene(
          'Disabled from the row above',
          'A host’s option already carries data-disabled, and the family reads it from any ancestor, so the row says it once.',
          `<div data-disabled>${line(mark('text="Gooseberry Transportes" query="berr"'), ' tone="muted"')}</div>`,
        ),
    ),
  }),
};

export const Context: Story = {
  decorators: [
    applicationConfig({
      providers: [provideHighlightDefaults({ occurrences: 'first', sensitivity: 'accent' })],
    }),
  ],
  parameters: scenario('context'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A supplier search, results for “aca”',
        'What combobox, select, multi-select and command-palette render: one root inside each label, the host owning the row, the keyboard and the count. The unavailable supplier keeps its rule and loses its tone.',
        // language: pt-BR
        result('Açaí do Vale Ltda.', 'Food · Portland, OR', 'aca') +
          // language: en-US
          result('Acadia Coatings', 'Finishes · Denver, CO', 'aca') +
          result('Macadamia Packaging', 'Packaging · Austin, TX', 'aca') +
          result('Vacaville Dairy', 'Registration suspended', 'aca', true),
      ) +
        scene(
          'One decision for the application',
          'provideHighlightDefaults sets locale, sensitivity and occurrences once for the injector — here first and accent; a mark that states any of them itself still wins.',
          // language: pt-BR
          line(mark(`text="Receipt of açaí and reimbursement" [query]="['re', 'aca']"`)) +
            // language: en-US
            line(
              mark(
                // language: pt-BR
                `text="Receipt of açaí and reimbursement" [query]="['re', 'aca']" occurrences="all" sensitivity="base"`,
                // language: en-US
              ),
            ),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    props: { long: `${CLAUSE} ${CLAUSE} ${CLAUSE}` },
    template: grid(
      2,
      scene(
        'A run that wraps',
        'Both halves carry the band and the rule: the box is cloned across the break rather than cut at the end of the first line.',
        `<div class="slotted-demo-measure">${line(mark('text="Consolidated annual sales report by supplier" query="consolidated annual"'))}</div>`,
      ) +
        scene(
          'Right-to-left text',
          'The indexes are logical, so the mark sits on the same word whichever direction the paragraph runs. Switch direction in the toolbar.',
          line(mark('text="شركة النور للتجارة والمقاولات" query="النور" dir="rtl" lang="ar"')) +
            line(mark('text="Supplier: شركة النور للتجارة" query="النور"')),
        ) +
        scene(
          'Graphemes',
          'A query inside a flag or a decomposed accent widens to the whole character, so no mark holds half a surrogate pair or an orphaned combining mark.',
          line(mark(`text="🇧🇷 Brasil · Crème" [query]="['bra', 'e']"`)),
        ) +
        scene(
          'A long label and a one-letter query',
          'Eight hundred characters and a hundred marks, answered in under a millisecond; a mark per occurrence, with no cap and no reflow.',
          line(mark('[text]="long" query="a"'), ' size="sm"'),
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The text is the text',
        'Every run is a slice of the string handed in; nothing is parsed and nothing is hidden. A label holding &lt;b&gt; reads &lt;b&gt;, and the marks are mark elements with no role written over them.',
        line(mark('text="Description: <b>bold</b> is not HTML here" query="<b>"')),
      ) +
        scene(
          'No hidden announcement',
          'mark is not announced by most screen readers by default, and the family adds no hidden “highlight start”: five matches in an option would be ten announcements. The rule is the application’s to write.',
          line(mark('text="The supplier notifies the substitute supplier" query="supplier"')),
        ),
    ),
  }),
};
