import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Container } from '../container';
import { Glyph, Icon } from '../icon';
import { Link } from '../link';
import { ResultState } from './result-state';
import { ResultStateDefaultsProvider } from './result-state-defaults';
import { BoardIllustration, Grid, Panel, Scene } from './result-state-demo';
import {
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateFooter,
  ResultStateTitle,
} from './result-state-parts';
import { REACT_RESULT_STATE_DOCS, REACT_RESULT_STATE_TOKENS } from './result-state.docs';
import type { ResultStateStatus } from './result-state.types';

const STATUSES: readonly { status: ResultStateStatus; title: string; body: string }[] = [
  {
    status: 'empty',
    title: 'No projects yet',
    body: 'The collection exists and has nothing inside.',
  },
  {
    status: 'no-results',
    title: 'Nothing matches the filter',
    body: 'A search or a filter found nothing.',
  },
  {
    status: 'not-found',
    title: 'This page does not exist',
    body: 'The requested resource is not here.',
  },
  {
    status: 'error',
    title: 'The run failed',
    body: 'A failure the reader can act on.',
  },
  {
    status: 'forbidden',
    title: 'You do not have access',
    body: 'The reader has no permission to view.',
  },
  {
    status: 'offline',
    title: 'No connection',
    body: 'The connection to the server dropped.',
  },
  {
    status: 'success',
    title: 'All published',
    body: 'The flow finished and there is nothing more to do.',
  },
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_RESULT_STATE_DOCS.resultState.scenes, {
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

const meta = {
  title: 'Components/Result State',
  component: ResultState,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Result State',
        description:
          'The region that stands in for content that is not there — no data yet, no match, a failure, a permission problem, a lost connection, a finished flow — and says what to do next. It holds no state of its own and announces its text without announcing its buttons.',
        framework: 'React',
        ...REACT_RESULT_STATE_DOCS.resultState,
        tokens: REACT_RESULT_STATE_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ResultState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    align: 'center',
    illustration: 'none',
    live: 'polite',
    reach: 'section',
    status: 'empty',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Panel>
        <ResultState
          {...args}
          media={
            args.illustration === undefined || args.illustration === 'none' ? undefined : (
              <Icon>
                <Glyph name="inbox" />
              </Icon>
            )
          }
        >
          <ResultStateContent>
            <ResultStateTitle>No projects yet</ResultStateTitle>
            <ResultStateDescription>
              Create a project to start collecting runs and comparing results.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button size="sm">Criar projeto</Button>
            <Button size="sm" variant="outline">
              Importar
            </Button>
          </ResultStateActions>
          <ResultStateFooter>
            <Link href="#projects">What is a project?</Link>
          </ResultStateFooter>
        </ResultState>
      </Panel>
    </div>
  ),
};

export const Statuses: Story = {
  parameters: scenario('statuses'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The seven, at the reach a list of them belongs in"
        note="Each status draws the glyph the contract maps it to and paints in the tone it names, so a permission problem and a failed request differ by silhouette as well as by colour."
      >
        {STATUSES.map(({ body, status, title }) => (
          <ResultState align="start" key={status} live="off" reach="inline" status={status}>
            <ResultStateContent>
              <ResultStateTitle>{title}</ResultStateTitle>
              <ResultStateDescription>{body}</ResultStateDescription>
            </ResultStateContent>
          </ResultState>
        ))}
      </Scene>
      <Scene
        label="The same seven with no colour at all"
        note="Switch the toolbar to high-contrast: every ground becomes the page’s own white and every mark black, and the shape is the only thing left telling the seven apart. WCAG 2.2 1.4.1."
      >
        {STATUSES.map(({ status, title }) => (
          <ResultState align="start" key={status} live="off" reach="inline" status={status}>
            <ResultStateContent>
              <ResultStateTitle>{title}</ResultStateTitle>
            </ResultStateContent>
          </ResultState>
        ))}
      </Scene>
    </Grid>
  ),
};

export const Reach: Story = {
  parameters: scenario('reach'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="inline, inside the cell it replaces the contents of"
        note="A row: the mark at control-glyph size, the words beside it, and the control on the same line. No illustration box at all — the guide asks that one not dominate a dense operational screen."
      >
        <Panel>
          <ResultState live="off" reach="inline" status="no-results">
            <ResultStateContent>
              <ResultStateTitle>No rows match the filter</ResultStateTitle>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm" tone="secondary" variant="ghost">
                Limpar filtros
              </Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="section, inside a card or a panel"
        note="The default. The mark takes the middle control height, the title the type scale’s xl step, and the description sits two steps below it so the two lines read in an order."
      >
        <Panel>
          <ResultState live="off" status="empty">
            <ResultStateContent>
              <ResultStateTitle>No environments configured</ResultStateTitle>
              <ResultStateDescription>
                An environment holds the variables and secrets of a deployment.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button>Criar ambiente</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="page, for the whole route"
        note="A mark half again the largest control and a title at the type scale’s top step — the size a page-level heading takes here, and one no control font size can reach."
      >
        <ResultState live="off" reach="page" status="not-found">
          <ResultStateContent>
            <ResultStateTitle render={(props) => <h2 {...props} />}>
              This page does not exist
            </ResultStateTitle>
            <ResultStateDescription>
              The address may have changed, or the project may have been archived.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button>Go to home</Button>
            <Button variant="outline">Back</Button>
          </ResultStateActions>
          <ResultStateFooter>
            <Link href="#status">View service status</Link>
          </ResultStateFooter>
        </ResultState>
      </Scene>
    </Grid>
  ),
};

export const Align: Story = {
  parameters: scenario('align'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="center, the default"
        note="For a panel or a route, where the region is the only thing on the screen and a centred column reads as a considered page rather than as an interruption."
      >
        <Panel>
          <ResultState align="center" live="off" status="forbidden">
            <ResultStateContent>
              <ResultStateTitle>You do not have access to this report</ResultStateTitle>
              <ResultStateDescription>Ask the workspace owner for access.</ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm">Pedir acesso</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="start, for a data-dense screen"
        note="Carbon left-aligns its empty states inside data-dense views and the other six surveyed implementations centre unconditionally. Both readings are real, and this is one axis rather than a second family."
      >
        <Panel>
          <ResultState align="start" live="off" status="forbidden">
            <ResultStateContent>
              <ResultStateTitle>You do not have access to this report</ResultStateTitle>
              <ResultStateDescription>Ask the workspace owner for access.</ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm">Pedir acesso</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
    </Grid>
  ),
};

export const Media: Story = {
  parameters: scenario('media'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The page’s own artwork, in the box the family keeps"
        note="The box is sized before anything is in it, so an illustration that has not loaded reserves the space it will occupy and the title below it never moves. Atlassian spends four props on this and Polaris a skeleton with an effect."
      >
        <Panel>
          <ResultState live="off" media={<BoardIllustration />} reach="page" status="empty">
            <ResultStateContent>
              <ResultStateTitle>Start with the first board</ResultStateTitle>
              <ResultStateDescription>
                A board holds cards, columns, and the people who work on them.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button>Criar quadro</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="A region with no illustration"
        note="Which is every region the page draws no picture for: the family draws none of its own, so the title is where the region starts (RS1)."
      >
        <Panel>
          <ResultState live="off" status="empty">
            <ResultStateContent>
              <ResultStateTitle>No illustration</ResultStateTitle>
              <ResultStateDescription>
                The region starts at the title and keeps the same rhythm.
              </ResultStateDescription>
            </ResultStateContent>
          </ResultState>
        </Panel>
      </Scene>
    </Grid>
  ),
};

export const Illustration: Story = {
  parameters: scenario('illustration'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A glyph in a framed tile, for a collection that has never held anything"
        note="A ring on the sunken surface around a raised card, the glyph in the muted text role. It is the largest control height with a step of air a side, so it tightens with density while the title keeps its size."
      >
        <Panel>
          <ResultState
            illustration="tile"
            live="off"
            media={
              <Icon>
                <Glyph name="inbox" />
              </Icon>
            }
          >
            <ResultStateContent>
              <ResultStateTitle>No messages</ResultStateTitle>
              <ResultStateDescription>
                Messages that arrive on this board appear here.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm">Escrever mensagem</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="Three layers leaning back, for the first of many things to come"
        note="The glyph stands on the front layer and is sheared with it. Switch the direction to rtl and the stack leans the other way, because depth is read from the reading edge; the glyph keeps its own direction."
      >
        <Panel>
          <ResultState
            illustration="stack"
            live="off"
            media={
              <Icon>
                <Glyph name="bell" />
              </Icon>
            }
          >
            <ResultStateContent>
              <ResultStateTitle>No alerts configured</ResultStateTitle>
              <ResultStateDescription>
                An alert notifies the team when a run fails or takes longer than expected.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm">Criar alerta</Button>
              <Button size="sm" variant="outline">
                Ver modelos
              </Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
      <Scene
        label="A stack of cards, standing in for the rows that are not there"
        note="The glyph takes the thumbnail's place and two lines stand in for the text. Without a glyph the lines start at the card's padding; the drawing needs no colour of the ground, so it holds on the sunken panel and on a raised surface alike."
      >
        <Panel>
          <ResultState
            illustration="cards"
            live="off"
            media={
              <Icon>
                <Glyph name="file-text" />
              </Icon>
            }
          >
            <ResultStateContent>
              <ResultStateTitle>No reports generated</ResultStateTitle>
              <ResultStateDescription>
                Connect a data source or upload a CSV to generate the first report.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm">Connect source</Button>
              <Button size="sm" variant="outline">
                Upload CSV
              </Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
        <div className="slotted-demo-surface" data-surface="raised">
          <ResultState illustration="cards" live="off">
            <ResultStateContent>
              <ResultStateTitle>No runs this week</ResultStateTitle>
              <ResultStateDescription>
                Scheduled runs appear here as soon as they start.
              </ResultStateDescription>
            </ResultStateContent>
          </ResultState>
        </div>
      </Scene>
      <Scene
        label="The whole route, and a table cell that asks for a drawing"
        note="At page reach the drawing is half again as large. At inline reach none is drawn — a cell holds one line of text — and the glyph stands beside the words at control size."
      >
        <Panel>
          <ResultState
            illustration="stack"
            live="off"
            media={
              <Icon>
                <Glyph name="search" />
              </Icon>
            }
            reach="page"
            status="no-results"
          >
            <ResultStateContent>
              <ResultStateTitle>No results for “service contract”</ResultStateTitle>
              <ResultStateDescription>
                Try another word, or clear the three active filters to see everything again.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button>Limpar filtros</Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
        <Panel>
          <ResultState
            illustration="stack"
            live="off"
            media={
              <Icon>
                <Glyph name="search" />
              </Icon>
            }
            reach="inline"
            status="no-results"
          >
            <ResultStateContent>
              <ResultStateTitle>No rows match the filter</ResultStateTitle>
            </ResultStateContent>
            <ResultStateActions>
              <Button size="sm" variant="ghost">
                Limpar
              </Button>
            </ResultStateActions>
          </ResultState>
        </Panel>
      </Scene>
    </Grid>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: function ActionsStory() {
    const [retrying, setRetrying] = useState(false);

    return (
      <Grid columns={1}>
        <Scene
          label="Two controls, a link that is not one, and a retry in flight"
          note="The controls are the consumer’s own Buttons, outside the live region — a reader hearing the message is not read two button labels in the middle of it. Press Tentar de novo: the pending state belongs to button, not here."
        >
          <Panel>
            <ResultState live="off" status="error">
              <ResultStateContent>
                <ResultStateTitle>The run failed</ResultStateTitle>
                <ResultStateDescription>
                  No artifact was written. Try again or open the full log.
                </ResultStateDescription>
              </ResultStateContent>
              <ResultStateActions>
                <Button
                  loading={retrying}
                  onClick={() => {
                    setRetrying(true);
                    setTimeout(() => setRetrying(false), 1600);
                  }}
                  tone="danger"
                >
                  Try again
                </Button>
                <Button variant="outline">Open record</Button>
              </ResultStateActions>
              <ResultStateFooter>
                <Link href="#retries">How retries are counted</Link>
              </ResultStateFooter>
            </ResultState>
          </Panel>
        </Scene>
        <Scene
          label="The same row in a column narrow enough to break it"
          note="Below a container width of 20rem the controls stack and keep their own widths: how wide a control is belongs to the control, and button already ships fullWidth for a consumer who wants it."
        >
          <div className="slotted-demo-measure">
            <Panel>
              <ResultState live="off" status="error">
                <ResultStateContent>
                  <ResultStateTitle>The run failed</ResultStateTitle>
                </ResultStateContent>
                <ResultStateActions>
                  <Button size="sm" tone="danger">
                    Tentar de novo
                  </Button>
                  <Button size="sm" variant="outline">
                    Open record
                  </Button>
                </ResultStateActions>
              </ResultState>
            </Panel>
          </div>
        </Scene>
      </Grid>
    );
  },
};

export const Live: Story = {
  parameters: scenario('live'),
  render: function LiveStory() {
    const [query, setQuery] = useState<'idle' | 'empty'>('idle');

    return (
      <Grid columns={1}>
        <Scene
          label="A region that arrives after the page did"
          note="Press the button and the results are replaced by a polite status region, which is the moment WCAG 2.2 SC 4.1.3 is about. Nothing takes focus: the reader hears the message where they are."
        >
          <ResultStateActions>
            <Button onClick={() => setQuery(query === 'idle' ? 'empty' : 'idle')} size="sm">
              {query === 'idle' ? 'Filter by “quarterly report”' : 'Clear the filter'}
            </Button>
          </ResultStateActions>
          <Panel>
            {query === 'idle' ? (
              <ResultState live="off" reach="inline">
                <ResultStateContent>
                  <ResultStateDescription>
                    Four reports listed. Filter to see the region appear.
                  </ResultStateDescription>
                </ResultStateContent>
              </ResultState>
            ) : (
              <ResultState live="polite" status="no-results">
                <ResultStateContent>
                  <ResultStateTitle>Nothing matches “quarterly report”</ResultStateTitle>
                  <ResultStateDescription>
                    Try another word, or clear the filter to see everything again.
                  </ResultStateDescription>
                </ResultStateContent>
              </ResultState>
            )}
          </Panel>
        </Scene>
        <Scene
          label="The loud one, and the opt-out"
          note="assertive writes role=alert and interrupts, which a failed save earns and an empty list does not. off is for a page that already owns a live region around this one, where polite would announce the same message twice."
        >
          <Panel>
            <ResultState live="assertive" status="error">
              <ResultStateContent>
                <ResultStateTitle>The connection dropped while sending</ResultStateTitle>
              </ResultStateContent>
            </ResultState>
          </Panel>
          <Panel>
            <ResultState live="off" status="empty">
              <ResultStateContent>
                <ResultStateTitle>No items</ResultStateTitle>
              </ResultStateContent>
            </ResultState>
          </Panel>
        </Scene>
      </Grid>
    );
  },
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A title no language breaks, and a digest that breaks nowhere"
        note="Both wrap rather than overflow, and nothing is removed from the DOM to make them fit: the whole string stays readable to assistive technology and findable by a page search."
      >
        <div className="slotted-demo-measure">
          <Panel>
            <ResultState live="off" status="error">
              <ResultStateContent>
                <ResultStateTitle>
                  Grundstücksverkehrsgenehmigungszuständigkeitsübertragungsverordnung
                </ResultStateTitle>
                <ResultStateDescription>
                  The run sha256:9f2c1a7b4e0d8c6f5a3b2e1d0c9b8a7f6e5d4c3b2a1908f7e6d5c4b3a2 failed
                  before writing any artifact.
                </ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          </Panel>
        </div>
      </Scene>
      <Scene
        label="A title standing alone, and a description standing alone"
        note="Two of the four rows are absent in each, and the vertical rhythm holds: the gap belongs to the grid rather than to margins the parts carry, so an absent part costs nothing."
      >
        <Panel>
          <ResultState live="off" status="success">
            <ResultStateContent>
              <ResultStateTitle>Tudo publicado</ResultStateTitle>
            </ResultStateContent>
          </ResultState>
        </Panel>
        <Panel>
          <ResultState live="off" status="empty">
            <ResultStateContent>
              <ResultStateDescription>
                A region with a description and no title is not a landmark, and does not pretend to
                be.
              </ResultStateDescription>
            </ResultStateContent>
          </ResultState>
        </Panel>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="The measure belongs to container"
        note="This family caps no width: two families offering a maximum measure would be two answers to one question. A page-wide region with no measure around it sets a centred sentence the full width of the route."
      >
        <Container inset={0} size="measure">
          <ResultState live="off" reach="page" status="no-results">
            <ResultStateContent>
              <ResultStateTitle>Nothing matches “quarterly report”</ResultStateTitle>
              <ResultStateDescription>
                Try another word, or clear the three active filters to see everything again.
              </ResultStateDescription>
            </ResultStateContent>
            <ResultStateActions>
              <Button>Limpar filtros</Button>
            </ResultStateActions>
          </ResultState>
        </Container>
      </Scene>
      <Scene
        label="The frame belongs to card"
        note="For the same reason: the region draws no box of its own, so the card’s three fills and its own padding scale are what a consumer reaches for when the empty state needs a frame."
      >
        <Card>
          <CardBody>
            <ResultState live="off" status="empty">
              <ResultStateContent>
                <ResultStateTitle>No members invited</ResultStateTitle>
                <ResultStateDescription>
                  Invite someone to share the boards in this workspace.
                </ResultStateDescription>
              </ResultStateContent>
              <ResultStateActions>
                <Button size="sm">Convidar</Button>
              </ResultStateActions>
            </ResultState>
          </CardBody>
        </Card>
      </Scene>
      <Scene
        label="The defaults an application sets once"
        note="Both regions below are written with no axis on them at all; the provider makes them inline and start-aligned, which is what a screen full of tables wants. An explicit prop on one region still wins."
      >
        <ResultStateDefaultsProvider align="start" live="off" reach="inline" status="no-results">
          <Panel>
            <ResultState>
              <ResultStateContent>
                <ResultStateTitle>No runs in this period</ResultStateTitle>
              </ResultStateContent>
            </ResultState>
          </Panel>
          <Panel>
            <ResultState status="offline">
              <ResultStateContent>
                <ResultStateTitle>No connection to the metrics server</ResultStateTitle>
              </ResultStateContent>
            </ResultState>
          </Panel>
        </ResultStateDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: function AccessibilityStory() {
    const region = useRef<HTMLElement>(null);

    return (
      <Grid columns={1}>
        <Scene
          label="The keyboard goes there when the application says so"
          note="Press the button: focus lands on the region and the ring appears. Tab from here and it leaves — the region carries tabindex=-1, so it is reachable and not in the sequence, and the family never moves focus by itself."
        >
          <ResultStateActions>
            <Button onClick={() => region.current?.focus()} size="sm" variant="outline">
              Send the keyboard to the region
            </Button>
          </ResultStateActions>
          <Panel>
            <ResultState live="off" ref={region} status="no-results">
              <ResultStateContent>
                <ResultStateTitle>Nothing matches the filter</ResultStateTitle>
                <ResultStateDescription>
                  A table that has just emptied can send the reader here.
                </ResultStateDescription>
              </ResultStateContent>
              <ResultStateActions>
                <Button size="sm">Limpar filtros</Button>
              </ResultStateActions>
            </ResultState>
          </Panel>
        </Scene>
        <Scene
          label="Named, and unnamed"
          note="The left region is a landmark called by its own title; the right one has no title, so no aria-labelledby is written at all — the APG requires a region landmark to have a label, and one pointing at nothing has neither."
        >
          <Panel>
            <ResultState live="polite" status="empty">
              <ResultStateContent>
                <ResultStateTitle>No projects yet</ResultStateTitle>
              </ResultStateContent>
            </ResultState>
          </Panel>
          <Panel>
            <ResultState live="polite" status="empty">
              <ResultStateContent>
                <ResultStateDescription>No projects yet.</ResultStateDescription>
              </ResultStateContent>
            </ResultState>
          </Panel>
        </Scene>
      </Grid>
    );
  },
};
