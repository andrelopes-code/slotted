import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import { SlCard, SlCardBody } from '@slotted/angular/card';
import { SlContainer } from '@slotted/angular/container';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlLink } from '@slotted/angular/link';

import { SlResultState } from './result-state';
import { provideResultStateDefaults } from './result-state-defaults';
import type {
  ResultStateAlign,
  ResultStateIllustration,
  ResultStateLive,
  ResultStateReach,
  ResultStateStatus,
} from './result-state-defaults';
import {
  SlResultStateActions,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateFooter,
  SlResultStateMedia,
  SlResultStateTitle,
} from './result-state-parts';
import { ANGULAR_RESULT_STATE_DOCS, ANGULAR_RESULT_STATE_TOKENS } from './result-state.docs';

interface ResultStateStoryArgs {
  align: ResultStateAlign;
  illustration: ResultStateIllustration;
  live: ResultStateLive;
  reach: ResultStateReach;
  status: ResultStateStatus;
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_RESULT_STATE_DOCS.resultState.scenes, {
    playground: Playground,
    statuses: Statuses,
    reach: Reach,
    align: Align,
    media: Media,
    illustration: Illustration,
    actions: Actions,
    live: Live,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<ResultStateStoryArgs> = {
  title: 'Components/Result State',
  component: SlResultState,
  decorators: [
    moduleMetadata({
      imports: [
        SlButton,
        SlCard,
        SlCardBody,
        SlContainer,
        SlGlyph,
        SlIcon,
        SlLink,
        SlResultState,
        SlResultStateActions,
        SlResultStateContent,
        SlResultStateDescription,
        SlResultStateFooter,
        SlResultStateMedia,
        SlResultStateTitle,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Result State',
        description:
          'The region that stands in for content that is not there — no data yet, no match, a failure, a permission problem, a lost connection, a finished flow — and says what to do next. It holds no state of its own and announces its text without announcing its buttons.',
        framework: 'Angular',
        ...ANGULAR_RESULT_STATE_DOCS.resultState,
        tokens: ANGULAR_RESULT_STATE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ResultStateStoryArgs>;

/**
 * One demonstration: what it is called, what to look at, and the stage that
 * owns the distance between the examples on it. Every story below composes this
 * rather than laying itself out, so no two examples can end up against each
 * other and no story reaches for an inline style.
 *
 * The stage is `block` throughout, because this family declares
 * `container-type: inline-size` and has no intrinsic width for a shrink-wrapping
 * stage to resolve. `specs/story-layout.test.mjs` refuses the other pairing.
 */
const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/**
 * The frame a result state usually replaces the contents of. It is the
 * workbench's own sunken surface rather than a border this file invents, so it
 * answers the scheme switch.
 */
const panel = (body: string) =>
  `<div class="slotted-demo-surface" data-surface="sunken">${body}</div>`;

const region = (attributes: string, title: string, body = '') =>
  `<section slResultState ${attributes}>
     <div slResultStateContent>
       ${title === '' ? '' : `<div slResultStateTitle>${title}</div>`}
       ${body === '' ? '' : `<p slResultStateDescription>${body}</p>`}
     </div>
   </section>`;

const STATUSES: readonly [ResultStateStatus, string, string][] = [
  ['empty', 'No projects yet', 'The collection exists and has nothing in it.'],
  ['no-results', 'Nothing matches the filter', 'A search or a filter found nothing.'],
  ['not-found', 'This page does not exist', 'The requested resource is not here.'],
  ['error', 'The run failed', 'A failure the reader can act on.'],
  ['forbidden', 'You do not have access', 'The reader does not have permission to view.'],
  ['offline', 'No connection', 'The connection to the server dropped.'],
  ['success', 'All published', 'The flow finished and there is nothing left to do.'],
];

export const Playground: Story = {
  args: {
    align: 'center',
    illustration: 'none',
    live: 'polite',
    reach: 'section',
    status: 'empty',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
      <div class="slotted-demo-stage" data-layout="block">
        <div class="slotted-demo-surface" data-surface="sunken">
          <section
            slResultState
            [status]="status"
            [reach]="reach"
            [align]="align"
            [live]="live"
            [illustration]="illustration"
          >
            @if (illustration !== 'none') {
              <span slIcon slResultStateMedia><svg slGlyph name="inbox"></svg></span>
            }
            <div slResultStateContent>
              <div slResultStateTitle>No projects yet</div>
              <p slResultStateDescription>
                Create a project to start collecting runs and comparing results.
              </p>
            </div>
            <div slResultStateActions>
              <button slButton size="sm" type="button">Criar projeto</button>
              <button slButton size="sm" variant="outline" type="button">Importar</button>
            </div>
            <div slResultStateFooter>
              <a slLink href="#projects">What is a project?</a>
            </div>
          </section>
        </div>
      </div>`,
  }),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The seven, at the reach a list of them belongs in',
        'Each status draws the glyph the contract maps it to and paints in the tone it names, so a permission problem and a failed request differ by silhouette as well as by colour.',
        STATUSES.map(([status, title, body]) =>
          region(`align="start" live="off" reach="inline" status="${status}"`, title, body),
        ).join(''),
      ) +
        scene(
          'The same seven with no colour at all',
          'Switch the toolbar to high-contrast: every ground becomes the page’s own white and every mark black, and the shape is the only thing left telling the seven apart. WCAG 2.2 1.4.1.',
          STATUSES.map(([status, title]) =>
            region(`align="start" live="off" reach="inline" status="${status}"`, title),
          ).join(''),
        ),
    ),
  }),
};

export const Reach: Story = {
  parameters: scenario('reach'),
  render: () => ({
    template: grid(
      1,
      scene(
        'inline, inside the cell it replaces the contents of',
        'A row: the mark at control-glyph size, the words beside it, and the control on the same line. No illustration box at all — the guide asks that one not dominate a dense operational screen.',
        panel(`<section slResultState live="off" reach="inline" status="no-results">
             <div slResultStateContent>
               <div slResultStateTitle>No rows match the filter</div>
             </div>
             <div slResultStateActions>
               <button slButton size="sm" tone="secondary" variant="ghost" type="button">
                 Limpar filtros
               </button>
             </div>
           </section>`),
      ) +
        scene(
          'section, inside a card or a panel',
          'The default. The mark takes the middle control height, the title the type scale’s xl step, and the description sits two steps below it so the two lines read in an order.',
          panel(`<section slResultState live="off" status="empty">
               <div slResultStateContent>
                 <div slResultStateTitle>No environment configured</div>
                 <p slResultStateDescription>
                   An environment holds the variables and secrets of a deployment.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton type="button">Criar ambiente</button>
               </div>
             </section>`),
        ) +
        scene(
          'page, for the whole route',
          'A mark half again the largest control and a title at the type scale’s top step — the size a page-level heading takes here, and one no control font size can reach. The title is an h2, which is the page’s choice rather than a prop.',
          `<section slResultState live="off" reach="page" status="not-found">
             <div slResultStateContent>
               <h2 slResultStateTitle>This page does not exist</h2>
               <p slResultStateDescription>
                 The address may have changed, or the project may have been archived.
               </p>
             </div>
             <div slResultStateActions>
               <button slButton type="button">Go to home</button>
               <button slButton variant="outline" type="button">Back</button>
             </div>
             <div slResultStateFooter>
               <a slLink href="#status">View service status</a>
             </div>
           </section>`,
        ),
    ),
  }),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => ({
    template: grid(
      2,
      scene(
        'center, the default',
        'For a panel or a route, where the region is the only thing on the screen and a centred column reads as a considered page rather than as an interruption.',
        panel(
          region(
            'align="center" live="off" status="forbidden"',
            'You do not have access to this report',
            'Ask the workspace owner for access.',
          ),
        ),
      ) +
        scene(
          'start, for a data-dense screen',
          'Carbon left-aligns its empty states inside data-dense views and the other six surveyed implementations centre unconditionally. Both readings are real, and this is one axis rather than a second family.',
          panel(
            region(
              'align="start" live="off" status="forbidden"',
              'You do not have access to this report',
              'Ask the workspace owner for access.',
            ),
          ),
        ),
    ),
  }),
};

export const Media: Story = {
  parameters: scenario('media'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The page’s own artwork, in the box the family keeps',
        'The box is sized before anything is in it, so an illustration that has not loaded reserves the space it will occupy and the title below it never moves. Atlassian spends four props on this and Polaris a skeleton with an effect.',
        panel(`<section slResultState live="off" reach="page" status="empty">
             <svg slResultStateMedia viewBox="0 0 96 64" focusable="false">
               <rect
                 x="2" y="10" width="60" height="44" rx="6"
                 fill="var(--slotted-tone-accent-surface)"
                 stroke="var(--slotted-tone-accent-border)" stroke-width="2"
               />
               <rect
                 x="34" y="2" width="60" height="44" rx="6"
                 fill="var(--slotted-surface)"
                 stroke="var(--slotted-border-strong)" stroke-width="2"
               />
               <path
                 d="M46 24h36M46 32h24"
                 stroke="var(--slotted-border-strong)" stroke-width="2" stroke-linecap="round"
               />
             </svg>
             <div slResultStateContent>
               <div slResultStateTitle>Start with the first board</div>
               <p slResultStateDescription>
                 A board holds cards, columns and the people who work on them.
               </p>
             </div>
             <div slResultStateActions>
               <button slButton type="button">Criar quadro</button>
             </div>
           </section>`),
      ) +
        scene(
          'A region with no illustration',
          'Which is every region the page draws no picture for: the family draws none of its own, so the title is where the region starts (RS1).',
          panel(
            region(
              'live="off" status="empty"',
              'No illustration',
              'The region starts at the title and keeps the same rhythm.',
            ),
          ),
        ),
    ),
  }),
};

/** A glyph projected into the media box, for the drawings made around it. */
const glyph = (name: string) =>
  `<span slIcon slResultStateMedia><svg slGlyph name="${name}"></svg></span>`;

export const Illustration: Story = {
  parameters: scenario('illustration'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A glyph in a framed tile, for a collection that has never held anything',
        'A ring on the sunken surface around a raised card, the glyph in the muted text role. It is the largest control height with a step of air a side, so it tightens with density while the title keeps its size.',
        panel(`<section slResultState illustration="tile" live="off">
             ${glyph('inbox')}
             <div slResultStateContent>
               <div slResultStateTitle>No messages</div>
               <p slResultStateDescription>Messages that arrive on this board appear here.</p>
             </div>
             <div slResultStateActions>
               <button slButton size="sm" type="button">Escrever mensagem</button>
             </div>
           </section>`),
      ) +
        scene(
          'Three layers leaning back, for the first of many things to come',
          'The glyph stands on the front layer and is sheared with it. Switch the direction to rtl and the stack leans the other way, because depth is read from the reading edge; the glyph keeps its own direction.',
          panel(`<section slResultState illustration="stack" live="off">
               ${glyph('bell')}
               <div slResultStateContent>
                 <div slResultStateTitle>No alerts configured</div>
                 <p slResultStateDescription>
                   An alert notifies the team when a run fails or takes longer than expected.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton size="sm" type="button">Criar alerta</button>
                 <button slButton size="sm" variant="outline" type="button">Ver modelos</button>
               </div>
             </section>`),
        ) +
        scene(
          'A stack of cards, standing in for the rows that are not there',
          'The glyph takes the thumbnail’s place and two lines stand in for the text. Without a glyph the lines start at the card’s padding; the drawing needs no colour of the ground, so it holds on the sunken panel and on a raised surface alike.',
          panel(`<section slResultState illustration="cards" live="off">
               ${glyph('file-text')}
               <div slResultStateContent>
                 <div slResultStateTitle>No reports generated</div>
                 <p slResultStateDescription>
                   Connect a data source or upload a CSV to generate the first report.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton size="sm" type="button">Connect source</button>
                 <button slButton size="sm" variant="outline" type="button">Upload CSV</button>
               </div>
             </section>`) +
            `<div class="slotted-demo-surface" data-surface="raised">
               <section slResultState illustration="cards" live="off">
                 <div slResultStateContent>
                   <div slResultStateTitle>No runs this week</div>
                   <p slResultStateDescription>Scheduled runs appear here as soon as they start.</p>
                 </div>
               </section>
             </div>`,
        ) +
        scene(
          'The whole route, and a table cell that asks for a drawing',
          'At page reach the drawing is half again as large. At inline reach none is drawn — a cell holds one line of text — and the glyph stands beside the words at control size.',
          panel(`<section slResultState illustration="stack" live="off" reach="page" status="no-results">
               ${glyph('search')}
               <div slResultStateContent>
                 <div slResultStateTitle>No results for “service contract”</div>
                 <p slResultStateDescription>
                   Try another word, or clear the three active filters to see everything again.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton type="button">Limpar filtros</button>
               </div>
             </section>`) +
            panel(`<section slResultState illustration="stack" live="off" reach="inline" status="no-results">
               ${glyph('search')}
               <div slResultStateContent>
                 <div slResultStateTitle>No rows match the filter</div>
               </div>
               <div slResultStateActions>
                 <button slButton size="sm" variant="ghost" type="button">Limpar</button>
               </div>
             </section>`),
        ),
    ),
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Two controls, a link that is not one, and a retry',
        'The controls are the consumer’s own buttons, outside the live region — a reader hearing the message is not read two button labels in the middle of it. The pending state belongs to button, not here.',
        panel(`<section slResultState live="off" status="error">
             <div slResultStateContent>
               <div slResultStateTitle>The run failed</div>
               <p slResultStateDescription>
                 No artifact was written. Try again or open the full log.
               </p>
             </div>
             <div slResultStateActions>
               <button slButton tone="danger" type="button">Try again</button>
               <button slButton variant="outline" type="button">Open record</button>
             </div>
             <div slResultStateFooter>
               <a slLink href="#retries">How retries are counted</a>
             </div>
           </section>`),
      ) +
        scene(
          'The same row in a column narrow enough to break it',
          'Below a container width of 20rem the controls stack and keep their own widths: how wide a control is belongs to the control, and button already ships fullWidth for a consumer who wants it.',
          `<div class="slotted-demo-measure">${panel(`<section slResultState live="off" status="error">
                 <div slResultStateContent>
                   <div slResultStateTitle>The run failed</div>
                 </div>
                 <div slResultStateActions>
                   <button slButton size="sm" tone="danger" type="button">Try again</button>
                   <button slButton size="sm" variant="outline" type="button">Open record</button>
                 </div>
               </section>`)}</div>`,
        ),
    ),
  }),
};

export const Live: Story = {
  parameters: scenario('live'),
  render: () => ({
    props: { filtered: false },
    template: grid(
      1,
      scene(
        'A region that arrives after the page did',
        'Press the button and the results are replaced by a polite status region, which is the moment WCAG 2.2 SC 4.1.3 is about. Nothing takes focus: the reader hears the message where they are.',
        `<div slResultStateActions>
             <button slButton size="sm" type="button" (click)="filtered = !filtered">
               {{ filtered ? 'Clear the filter' : 'Filter by “quarterly report”' }}
             </button>
           </div>
           ${panel(`@if (filtered) {
               <section slResultState live="polite" status="no-results">
                 <div slResultStateContent>
                   <div slResultStateTitle>Nothing matches “quarterly report”</div>
                   <p slResultStateDescription>
                     Try another word, or clear the filter to see everything again.
                   </p>
                 </div>
               </section>
             } @else {
               <section slResultState live="off" reach="inline">
                 <div slResultStateContent>
                   <p slResultStateDescription>
                     Four reports listed. Filter to see the region appear.
                   </p>
                 </div>
               </section>
             }`)}`,
      ) +
        scene(
          'The loud one, and the opt-out',
          'assertive writes role=alert and interrupts, which a failed save earns and an empty list does not. off is for a page that already owns a live region around this one, where polite would announce the same message twice.',
          panel(
            region('live="assertive" status="error"', 'The connection dropped during the upload'),
          ) + panel(region('live="off" status="empty"', 'No items')),
        ),
    ),
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: grid(
      2,
      scene(
        'A title no language breaks, and a digest that breaks nowhere',
        'Both wrap rather than overflow, and nothing is removed from the DOM to make them fit: the whole string stays readable to assistive technology and findable by a page search.',
        `<div class="slotted-demo-measure">${panel(
          region(
            'live="off" status="error"',
            'Grundstücksverkehrsgenehmigungszuständigkeitsübertragungsverordnung',
            'Run sha256:9f2c1a7b4e0d8c6f5a3b2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a2 failed before writing any artifact.',
          ),
        )}</div>`,
      ) +
        scene(
          'A title standing alone, and a description standing alone',
          'Two of the four rows are absent in each, and the vertical rhythm holds: the gap belongs to the grid rather than to margins the parts carry, so an absent part costs nothing.',
          panel(region('live="off" status="success"', 'Tudo publicado')) +
            panel(
              region(
                'live="off" status="empty"',
                '',
                'A region with a description and no title is not a landmark, and does not pretend to be.',
              ),
            ),
        ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [provideResultStateDefaults({ align: 'start', live: 'off', reach: 'inline' })],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'The measure belongs to container',
        'This family caps no width: two families offering a maximum measure would be two answers to one question. A page-wide region with no measure around it sets a centred sentence the full width of the route.',
        `<div slContainer size="measure" [inset]="0">
             <section slResultState align="center" live="off" reach="page" status="no-results">
               <div slResultStateContent>
                 <div slResultStateTitle>Nothing matches “quarterly report”</div>
                 <p slResultStateDescription>
                   Try another word, or clear the three active filters to see everything again.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton type="button">Limpar filtros</button>
               </div>
             </section>
           </div>`,
      ) +
        scene(
          'The frame belongs to card',
          'For the same reason: the region draws no box of its own, so the card’s three fills and its own padding scale are what a consumer reaches for when the empty state needs a frame.',
          `<div slCard>
               <div slCardBody>
                 <section slResultState align="center" live="off" reach="section" status="empty">
                   <div slResultStateContent>
                     <div slResultStateTitle>No members invited</div>
                     <p slResultStateDescription>
                       Invite someone to share the boards of this workspace.
                     </p>
                   </div>
                   <div slResultStateActions>
                     <button slButton size="sm" type="button">Convidar</button>
                   </div>
                 </section>
               </div>
             </div>`,
        ) +
        scene(
          'The defaults an application sets once',
          'Both regions below are written with no axis on them at all; provideResultStateDefaults makes them inline and start-aligned, which is what a screen full of tables wants. An explicit input on one region still wins.',
          panel(region('', 'No runs in this period')) +
            panel(region('status="offline"', 'No connection to the metrics server')),
        ),
    ),
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: grid(
      1,
      scene(
        'The keyboard goes there when the application says so',
        'Press the button: focus lands on the region and the ring appears. Tab from here and it leaves — the region carries tabindex=-1, so it is reachable and not in the sequence, and the family never moves focus by itself.',
        `<div slResultStateActions>
             <button slButton size="sm" variant="outline" type="button" (click)="target.focus()">
               Send the keyboard to the region
             </button>
           </div>
           ${panel(`<section slResultState #target="slResultState" live="off" status="no-results">
               <div slResultStateContent>
                 <div slResultStateTitle>Nothing matches the filter</div>
                 <p slResultStateDescription>
                   A table that has just emptied can send the reader here.
                 </p>
               </div>
               <div slResultStateActions>
                 <button slButton size="sm" type="button">Limpar filtros</button>
               </div>
             </section>`)}`,
      ) +
        scene(
          'Named, and unnamed',
          'The left region is a landmark called by its own title; the right one has no title, so no aria-labelledby is written at all — the APG requires a region landmark to have a label, and one pointing at nothing has neither.',
          panel(region('live="polite" status="empty"', 'No projects yet')) +
            panel(region('live="polite" status="empty"', '', 'No projects yet.')),
        ),
    ),
  }),
};
