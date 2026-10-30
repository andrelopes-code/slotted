import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState, type ReactNode } from 'react';

import { Button } from '../button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../dialog';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Inline } from '../inline';
import { Segment, SegmentedControl } from '../segmented-control';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { Tour, useTour } from './tour';
import { TourContent, TourDescription, TourFooter, TourNext, TourTitle } from './tour-parts';
import { REACT_TOUR_DOCS, REACT_TOUR_TOKENS } from './tour.docs';
import type {
  TourHandle,
  TourOpenRequest,
  TourProps,
  TourStep,
  TourStepRequest,
} from './tour.types';

/* ── A reports workspace, the one product every scene is taken from ─────── */

const REPORTS = [
  'Quarterly revenue · Finance · updated 2 hours ago',
  'Churn by plan · Growth · updated yesterday',
  'Support backlog · Operations · updated 12 Sep',
];

interface ScreenProps {
  id: string;
  sidebar?: boolean | undefined;
  /** Something the scene adds to the toolbar. */
  extra?: ReactNode;
  /** Something the scene adds under the toolbar. */
  below?: ReactNode;
  onNewReport?: (() => void) | undefined;
}

/** The screen a tour walks through. Every id is prefixed, so each scene points at its own. */
function Screen({ below, extra, id, onNewReport, sidebar = true }: ScreenProps) {
  return (
    <div className="slotted-demo-surface" data-surface="raised">
      <Inline align="start" gap={6} wrap="wrap">
        {sidebar && (
          <nav aria-label="Workspace" id={`${id}-nav`}>
            <Stack gap={2}>
              <Text weight="semibold">Workspace</Text>
              <Text tone="muted">Reports</Text>
              <Text tone="muted">Dashboards</Text>
              <Text id={`${id}-billing`} tone="muted">
                Billing
              </Text>
            </Stack>
          </nav>
        )}
        <Stack gap={4}>
          <Inline gap={3} wrap="wrap">
            <TextField
              aria-label="Search reports"
              id={`${id}-search`}
              placeholder="Search reports"
              type="search"
            />
            <Button id={`${id}-filters`} tone="secondary" variant="outline">
              Filters
            </Button>
            <Button id={`${id}-views`} tone="secondary" variant="outline">
              Saved views
            </Button>
            <Button id={`${id}-share`} tone="secondary" variant="outline">
              Share
            </Button>
            <Button id={`${id}-export`} tone="accent">
              Export
            </Button>
            <Button id={`${id}-new`} onClick={onNewReport} tone="accent" variant="outline">
              New report
            </Button>
            {extra}
          </Inline>
          {below}
          <Stack gap={2}>
            {REPORTS.map((report) => (
              <Text key={report}>{report}</Text>
            ))}
          </Stack>
        </Stack>
      </Inline>
    </div>
  );
}

/**
 * A field's id is its input's, and the input stands inset in the field's
 * frame: a step about the field points at the frame, through a function.
 */
const fieldOf = (id: string) => () =>
  document.getElementById(id)?.closest('[data-ui="text-field"]') ?? null;

function tourOf(id: string): TourStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to Reports',
      description:
        'Five stops, about a minute. You can leave at any point and pick it up from Help.',
      messages: { next: 'Start tour', skip: 'Not now' },
    },
    {
      id: 'search',
      target: fieldOf(`${id}-search`),
      title: 'Find any report',
      description: 'Search reads titles, owners and the names of the charts inside.',
    },
    {
      id: 'filters',
      target: `#${id}-filters`,
      title: 'Narrow it down',
      description: 'Filters stay applied while you move between reports.',
    },
    {
      id: 'share',
      target: `#${id}-share`,
      title: 'Share with your team',
      description:
        'Invite people by name or email. They see the report as it stands, and every edit after.',
    },
    {
      id: 'export',
      target: `#${id}-export`,
      title: 'Export what you see',
      description: 'The file keeps your filters and your column order.',
    },
  ];
}

function describeOpen(open: boolean, request: TourOpenRequest): string {
  const outcome = request.outcome === undefined ? '' : `, outcome: ${request.outcome}`;
  return `onOpenChange(${String(open)}) — reason: ${request.reason}${outcome}`;
}

function describeStep(step: string | null, request: TourStepRequest): string {
  return `onStepChange(${step ?? 'null'}) — reason: ${request.reason}`;
}

/**
 * A screen, the button that starts its tour, and the last request written
 * under it — the shape of every scene below.
 */
function Demo({
  below,
  controls,
  extra,
  id,
  label = 'Start tour',
  sidebar,
  startOpen = false,
  steps,
  ...props
}: Partial<TourProps> & {
  /** Opens at once: the story's own page shows the tour, the reference page waits for Start. */
  startOpen?: boolean;
  below?: ReactNode;
  controls?: ReactNode;
  extra?: ReactNode;
  id: string;
  label?: string;
  sidebar?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [last, setLast] = useState('No request yet.');
  return (
    <Stack gap={4}>
      <Inline align="center" gap={3} wrap="wrap">
        <Button onClick={() => setOpen(true)}>{label}</Button>
        {controls}
      </Inline>
      <Screen below={below} extra={extra} id={id} sidebar={sidebar} />
      <Text size="sm" tone="muted">
        {last}
      </Text>
      <Tour
        {...props}
        onOpenChange={(next, request) => {
          setLast(describeOpen(next, request));
          setOpen(next);
        }}
        onStepChange={(next, request) => setLast(describeStep(next, request))}
        open={open}
        steps={steps ?? tourOf(id)}
      />
    </Stack>
  );
}

function One({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        {children}
      </Scene>
    </Grid>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOUR_DOCS.tour.scenes, {
    playground: Playground,
    placement: Placement,
    centered: Centered,
    spotlight: Spotlight,
    modal: Modal,
    interactive: Interactive,
    availability: Availability,
    missing: Missing,
    prepare: Prepare,
    controlled: Controlled,
    composition: Composition,
    labels: Labels,
    keyboard: Keyboard,
    compact: Compact,
    edges: Edges,
    layers: Layers,
  });

const meta = {
  title: 'Components/Tour',
  component: Tour,
  args: { steps: tourOf('playground') },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tour',
        description:
          'A guided walk through an interface, one step at a time: a card beside each target and a spotlight that says which one. Steps may be conditional, may prepare the page, may wait for the reader to act, and survive a target that is not there; the tour is modal, with the page inert behind it, or a coach mark that leaves the page alone. Closing says how the tour ended, so the product can decide whether to offer it again.',
        framework: 'React',
        ...REACT_TOUR_DOCS.tour,
        tokens: REACT_TOUR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => (
    <One
      label="The five stops of a reports workspace"
      note="Start it, walk it with Next and Back, and read the last request under the screen. The card follows the spotlight from the search field to Export."
    >
      <Demo id="playground" startOpen={context.viewMode === 'story'} />
    </One>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <One
      label="A side for every target"
      note="The sidebar step stands beside the navigation, the export step above its button, aligned to its end; the others below. Narrow the window and watch them flip and slide."
    >
      <Demo
        id="placement"
        steps={[
          {
            id: 'nav',
            target: '#placement-nav',
            side: 'inline-end',
            title: 'Every workspace',
            description: 'Reports, dashboards and billing, one click away.',
          },
          {
            id: 'search',
            target: fieldOf('placement-search'),
            side: 'bottom',
            align: 'start',
            title: 'Find any report',
          },
          {
            id: 'export',
            target: '#placement-export',
            side: 'top',
            align: 'end',
            title: 'Export what you see',
            description: 'Aligned to the end of the button, and above it.',
          },
        ]}
      />
    </One>
  ),
};

function ReportsPicture() {
  return (
    <svg aria-hidden="true" viewBox="0 0 320 120">
      <rect fill="var(--slotted-tone-accent-surface)" height="120" width="320" />
      <rect
        fill="var(--slotted-surface-raised)"
        height="92"
        rx="8"
        stroke="var(--slotted-tone-accent-border)"
        width="240"
        x="40"
        y="28"
      />
      <rect fill="var(--slotted-tone-accent-solid)" height="10" rx="5" width="96" x="56" y="44" />
      <rect fill="var(--slotted-tone-accent-border)" height="8" rx="4" width="176" x="56" y="64" />
      <rect fill="var(--slotted-tone-accent-border)" height="8" rx="4" width="140" x="56" y="80" />
    </svg>
  );
}

export const Centered: Story = {
  parameters: scenario('centered'),
  render: () => (
    <One
      label="The opening card"
      note="No target: the card stands in the middle over the whole scrim, with a picture as its media and its own labels. The next step takes the spotlight to the search field."
    >
      <Demo
        id="centered"
        steps={[
          {
            id: 'welcome',
            title: 'Welcome to Reports',
            description:
              'Five stops, about a minute. You can leave at any point and pick it up from Help.',
            media: <ReportsPicture />,
            messages: { next: 'Start tour', skip: 'Not now' },
          },
          ...tourOf('centered').slice(1),
        ]}
      />
    </One>
  ),
};

export const Spotlight: Story = {
  parameters: scenario('spotlight'),
  render: () => {
    const [coach, setCoach] = useState(false);
    return (
      <One
        label="The spotlight, and the coach mark without one"
        note="Start tour cuts each target out of the scrim and moves the cutout from one to the next. Show tip is a single non-modal card with no spotlight: the page stays bright and usable."
      >
        <Demo
          controls={
            <Button onClick={() => setCoach(true)} tone="secondary" variant="outline">
              Show tip
            </Button>
          }
          id="spotlight"
        />
        <Tour
          modal={false}
          onOpenChange={setCoach}
          open={coach}
          size="sm"
          spotlight={false}
          steps={[
            {
              id: 'views',
              target: '#spotlight-views',
              title: 'Keep this view',
              description: 'Save the filters and columns you use every week.',
              messages: { done: 'Got it' },
            },
          ]}
        />
      </One>
    );
  },
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Modal: the page is out of reach"
        note="Try to click the search field or Tab out of the card: the page is inert, Tab cycles inside the card, and only Escape, Skip or the close control leave."
      >
        <Demo id="modal-on" />
      </Scene>
      <Scene
        label="Not modal: the page stays reachable"
        note="modal={false} with closeOnOutsidePress: the scrim still dims, but the page answers the pointer and the keyboard, and a press outside the card closes the tour."
      >
        <Demo closeOnOutsidePress id="modal-off" modal={false} />
      </Scene>
    </Grid>
  ),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => (
    <One
      label="Press New report to go on"
      note="The step is interactive, so New report stays operable in the spotlight and the step is not modal. Next is gone: pressing the target is what advances, and Tab from the card reaches it."
    >
      <Demo
        id="interactive"
        steps={[
          {
            id: 'create',
            target: '#interactive-new',
            title: 'Create your first report',
            description: 'Press New report. The tour continues once it opens.',
            interactive: true,
            advanceOn: 'click',
          },
          {
            id: 'created',
            title: 'Your report is ready',
            description: 'Untitled report 1 is in the list. Give it a name when you have one.',
          },
        ]}
      />
    </One>
  ),
};

export const Availability: Story = {
  parameters: scenario('availability'),
  render: () => {
    const [role, setRole] = useState('viewer');
    return (
      <One
        label="Billing, for owners only"
        note="As a viewer the tour has three steps and “1 of 3”; switch to owner and the billing step joins, “1 of 4”. Next and Back pass over it in both directions while it does not apply."
      >
        <Demo
          controls={
            <SegmentedControl
              aria-label="Role"
              onValueChange={(next) => setRole(next)}
              size="sm"
              value={role}
            >
              <Segment value="viewer">Viewer</Segment>
              <Segment value="owner">Owner</Segment>
            </SegmentedControl>
          }
          id="availability"
          steps={[
            { id: 'search', target: fieldOf('availability-search'), title: 'Find any report' },
            {
              id: 'billing',
              target: '#availability-billing',
              side: 'inline-end',
              title: 'Invoices and plans',
              description: 'Only owners see billing.',
              when: () => role === 'owner',
            },
            { id: 'share', target: '#availability-share', title: 'Share with your team' },
            { id: 'export', target: '#availability-export', title: 'Export what you see' },
          ]}
        />
      </One>
    );
  },
};

export const Missing: Story = {
  parameters: scenario('missing'),
  render: () => {
    const [policy, setPolicy] = useState<'center' | 'skip'>('center');
    return (
      <One
        label="The sidebar is collapsed"
        note="The sidebar step has nothing to point at. Under center it stands in the middle with data-missing and no spotlight, and the reader keeps going; under skip it is passed over and not counted."
      >
        <Demo
          controls={
            <SegmentedControl
              aria-label="When a target is missing"
              onValueChange={(next) => setPolicy(next as 'center' | 'skip')}
              size="sm"
              value={policy}
            >
              <Segment value="center">center</Segment>
              <Segment value="skip">skip</Segment>
            </SegmentedControl>
          }
          id="missing"
          missing={policy}
          sidebar={false}
          steps={[
            { id: 'search', target: fieldOf('missing-search'), title: 'Find any report' },
            {
              id: 'nav',
              target: '#missing-nav',
              title: 'Find it all in the sidebar',
              description:
                'Every report, dashboard and saved view is one click away from the menu.',
            },
            { id: 'export', target: '#missing-export', title: 'Export what you see' },
          ]}
        />
      </One>
    );
  },
};

export const Prepare: Story = {
  parameters: scenario('prepare'),
  render: () => {
    const [menu, setMenu] = useState(false);
    return (
      <One
        label="Opening the column menu before its step"
        note="Next on the first step runs prepare: the menu opens, the columns load for a second, and Next carries its loading sweep until the menu — the step’s target — is on the page."
      >
        <Demo
          below={
            menu && (
              <div className="slotted-demo-surface" data-surface="sunken" id="prepare-columns">
                <Stack gap={2}>
                  <Text weight="semibold">Columns</Text>
                  <Text>Report · Owner · Updated · Views</Text>
                </Stack>
              </div>
            )
          }
          id="prepare"
          steps={[
            { id: 'search', target: fieldOf('prepare-search'), title: 'Find any report' },
            {
              id: 'columns',
              target: '#prepare-columns',
              title: 'Choose your columns',
              description: 'Show, hide and reorder what the list shows.',
              prepare: (signal) =>
                new Promise<void>((resolve) => {
                  setMenu(true);
                  const timer = setTimeout(resolve, 1000);
                  signal.addEventListener('abort', () => clearTimeout(timer));
                }),
            },
            { id: 'export', target: '#prepare-export', title: 'Export what you see' },
          ]}
        />
      </One>
    );
  },
};

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<string | null>('filters');
    const [filtered, setFiltered] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const record = (line: string) => setLog((lines) => [line, ...lines].slice(0, 4));
    return (
      <One
        label="Resume, refuse and record"
        note="The product starts the tour at the step it saved, filters. Next is refused until a filter is applied; closing writes the outcome the product would store to decide whether to offer the tour again."
      >
        <Stack gap={4}>
          <Inline align="center" gap={3} wrap="wrap">
            <Button onClick={() => setOpen(true)}>Resume tour</Button>
            <Button
              onClick={() => setFiltered((value) => !value)}
              tone="secondary"
              variant="outline"
            >
              {filtered ? 'Remove the filter' : 'Apply a filter'}
            </Button>
            <Text tone="muted">{`step: ${step ?? 'null'} · filtered: ${String(filtered)}`}</Text>
          </Inline>
          <Screen id="controlled" />
          <Stack gap={1}>
            {log.map((line, index) => (
              <Text key={`${index}-${line}`} size="sm" tone="muted">
                {line}
              </Text>
            ))}
          </Stack>
          <Tour
            onOpenChange={(next, request) => {
              record(describeOpen(next, request));
              setOpen(next);
            }}
            onStepChange={(next, request) => {
              if (step === 'filters' && next === 'share' && !filtered) {
                record('Refused: apply a filter first.');
                request.cancel();
                return;
              }
              record(describeStep(next, request));
              setStep(next);
            }}
            open={open}
            step={step}
            steps={tourOf('controlled')}
          />
        </Stack>
      </One>
    );
  },
};

function Dots() {
  const { position, total } = useTour();
  return (
    <Text aria-hidden="true" tone="muted">
      {'●'.repeat(position) + '○'.repeat(Math.max(0, total - position))}
    </Text>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => {
    const [guide, setGuide] = useState(false);
    return (
      <One
        label="The product’s own card"
        note="Dots from useTour() in place of the progress text, a Read the guide action beside Next, and the title rendered as an h3 because the page already has its h2."
      >
        <Demo
          id="composition"
          steps={tourOf('composition').slice(1)}
          below={guide && <Text tone="muted">The guide would open in a side panel here.</Text>}
        >
          <TourContent>
            <TourTitle render={(props) => <h3 {...props} />} />
            <TourDescription />
            <TourFooter>
              <Dots />
              <Button onClick={() => setGuide(true)} size="sm" tone="secondary" variant="ghost">
                Read the guide
              </Button>
              <TourNext />
            </TourFooter>
          </TourContent>
        </Demo>
      </One>
    );
  },
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="In Portuguese, once for the application"
        // language: pt-BR
        note="The language in force says Próximo, Voltar, Concluir, Pular tour, Fechar tour and “2 de 4”; every tour under the provider reads them."
        // language: en-US
      >
        <SlottedProvider locale="pt-BR">
          <Demo
            id="labels-pt"
            label="Iniciar tour"
            steps={[
              {
                id: 'search',
                target: fieldOf('labels-pt-search'),
                title: 'Find any report',
              },
              { id: 'filters', target: '#labels-pt-filters', title: 'Refine the list' },
              { id: 'share', target: '#labels-pt-share', title: 'Share with the team' },
              { id: 'export', target: '#labels-pt-export', title: 'Export what you see' },
            ]}
          />
        </SlottedProvider>
      </Scene>
      <Scene
        label="A long German title and progress"
        note="Automatisierungsregelverwaltungsoberfläche is one unbroken word and “Schritt 1 von 2 in der Einführung” a long progress: both wrap inside the card, which keeps its measure."
      >
        <Demo
          id="labels-de"
          messages={{
            done: 'Fertig',
            next: 'Weiter',
            prev: 'Zurück',
            progress: 'Schritt {position} von {total} in der Einführung',
            skip: 'Tour überspringen',
          }}
          steps={[
            {
              id: 'rules',
              target: '#labels-de-new',
              title: 'Automatisierungsregelverwaltungsoberfläche',
              description: 'Regeln laufen, wenn sich ein Bericht ändert.',
            },
            { id: 'export', target: '#labels-de-export', title: 'Exportieren, was Sie sehen' },
          ]}
        />
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => {
    const tour = useRef<TourHandle>(null);
    return (
      <One
        label="Start, walk and leave without the pointer"
        note="Tab to Start tour and press Enter: focus is on the card. ArrowRight and ArrowLeft go on and back — mirrored right to left — Tab reaches the buttons, and Escape gives focus back to Start tour."
      >
        <Stack gap={4}>
          <Inline gap={3}>
            <Button onClick={() => tour.current?.start()}>Start tour</Button>
            <Button onClick={() => tour.current?.start('share')} tone="secondary" variant="outline">
              Start at Share
            </Button>
          </Inline>
          <Screen id="keyboard" />
          <Tour ref={tour} steps={tourOf('keyboard')} />
        </Stack>
      </One>
    );
  },
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => (
    <One
      label="The phone composition"
      note='layout="compact" forces what a viewport under 600 pixels gets by itself: the sidebar step asked for inline-end and stands below its target instead, and every card is as wide as the room allows.'
    >
      <div className="slotted-demo-room" data-room="phone">
        <Demo
          id="compact"
          layout="compact"
          steps={[
            {
              id: 'nav',
              target: '#compact-nav',
              side: 'inline-end',
              title: 'Every workspace',
              description: 'Reports, dashboards and billing, one tap away.',
            },
            { id: 'search', target: fieldOf('compact-search'), title: 'Find any report' },
            { id: 'export', target: '#compact-export', title: 'Export what you see' },
          ]}
        />
      </div>
    </One>
  ),
};

export const Edges: Story = {
  parameters: scenario('edges'),
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <One
        label="Corners, edges and a target that fills the screen"
        note="Each corner step asks for the side that has no room: the card flips and slides along the edge and the arrow keeps pointing. The chart leaves no side tall enough, so its card is centerd over it and the spotlight still frames it."
      >
        <Stack gap={4}>
          <div>
            <Button onClick={() => setOpen(true)}>Start tour</Button>
          </div>
          <Stack gap={6}>
            <Inline justify="between">
              <Button id="edges-alerts" tone="secondary" variant="outline">
                Notifications
              </Button>
              <Button id="edges-account" tone="secondary" variant="outline">
                Account
              </Button>
            </Inline>
            <div className="slotted-demo-viewport" data-size="screen" id="edges-chart">
              <Text tone="muted">Revenue by region, last twelve months</Text>
            </div>
            <Inline justify="between">
              <Button id="edges-help" tone="secondary" variant="outline">
                Help
              </Button>
              <Button id="edges-feedback" tone="secondary" variant="outline">
                Feedback
              </Button>
            </Inline>
          </Stack>
          <Tour
            onOpenChange={setOpen}
            open={open}
            steps={[
              {
                id: 'alerts',
                target: '#edges-alerts',
                side: 'top',
                align: 'start',
                title: 'Notifications',
                description: 'Asked for the top; there is no room above, so it stands below.',
              },
              {
                id: 'account',
                target: '#edges-account',
                side: 'inline-end',
                title: 'Account',
                description: 'Asked for the end; the edge is right there, so it moves.',
              },
              {
                id: 'chart',
                target: '#edges-chart',
                title: 'Revenue by region',
                description: 'Taller than the room around it: the card is centerd over it.',
              },
              {
                id: 'feedback',
                target: '#edges-feedback',
                side: 'bottom',
                align: 'end',
                title: 'Feedback',
                description: 'Asked for the bottom at the foot of the page: it flips above.',
              },
            ]}
          />
        </Stack>
      </One>
    );
  },
};

export const Layers: Story = {
  parameters: scenario('layers'),
  render: () => {
    const [open, setOpen] = useState(false);
    const [invite, setInvite] = useState(false);
    return (
      <One
        label="A tour through the invite dialog"
        note="The second step opens the dialog in its prepare and points at the emails field inside it; the tour stays on top and the dialog is what goes inert. Escape closes the tour and leaves the dialog open, where the reader was."
      >
        <Stack gap={4}>
          <Inline gap={3}>
            <Button onClick={() => setOpen(true)}>Start tour</Button>
            <Button
              id="layers-invite"
              onClick={() => setInvite(true)}
              tone="secondary"
              variant="outline"
            >
              Invite people
            </Button>
          </Inline>
          <Screen id="layers" />
          <Dialog onOpenChange={setInvite} open={invite}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite people</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <TextField aria-label="Emails" id="layers-emails" placeholder="ana@example.com" />
              </DialogBody>
              <DialogFooter>
                <Button id="layers-send">Send invites</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Tour
            onOpenChange={setOpen}
            open={open}
            steps={[
              {
                id: 'invite',
                target: '#layers-invite',
                title: 'Bring your team in',
                description: 'Everyone you invite sees the reports you share with them.',
              },
              {
                id: 'emails',
                target: fieldOf('layers-emails'),
                title: 'Type their emails',
                description: 'Separate them with commas; each one gets its own invitation.',
                prepare: () =>
                  new Promise<void>((resolve) => {
                    setInvite(true);
                    setTimeout(resolve, 300);
                  }),
              },
              {
                id: 'send',
                target: '#layers-send',
                title: 'Send when ready',
                description: 'Invitations expire after seven days.',
              },
            ]}
          />
        </Stack>
      </One>
    );
  },
};
