import { Component, computed, input, signal } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import {
  SlDialog,
  SlDialogBody,
  SlDialogFooter,
  SlDialogHeader,
  SlDialogTitle,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlSegment, SlSegmentedControl } from '@slotted/angular/segmented-control';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import type { PartialMessages, TourMessages } from '@slotted/core/i18n';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlTour } from './tour';
import type {
  TourLayout,
  TourMissing,
  TourOpenRequest,
  TourStep,
  TourStepRequest,
} from './tour-defaults';
import {
  SlTourCard,
  SlTourContent,
  SlTourDescription,
  SlTourFooter,
  SlTourNext,
  SlTourStep,
  SlTourTitle,
} from './tour-parts';
import { ANGULAR_TOUR_DOCS, ANGULAR_TOUR_TOKENS } from './tour.docs';

/* ── A reports workspace, the one product every scene is taken from ─────── */

const REPORTS = [
  'Quarterly revenue · Finance · updated 2 hours ago',
  'Churn by plan · Growth · updated yesterday',
  'Support backlog · Operations · updated 12 Sep',
];

/**
 * A step about a field points at the field's frame, which carries the id:
 * the input stands inset in it, and `slTextFieldInput` writes its own id.
 */
const fieldOf = (id: string) => `#${id}`;

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

/** The screen a tour walks through. Every id is prefixed, so each scene points at its own. */
@Component({
  selector: 'sl-tour-screen',
  standalone: true,
  imports: [SlButton, SlInline, SlStack, SlText, SlTextField, SlTextFieldInput],
  template: `<div class="slotted-demo-surface" data-surface="raised">
    <div slInline align="start" [gap]="6" wrap="wrap">
      @if (sidebar()) {
        <nav aria-label="Workspace" [id]="id() + '-nav'">
          <div slStack [gap]="2">
            <span slText weight="semibold">Workspace</span>
            <span slText tone="muted">Reports</span>
            <span slText tone="muted">Dashboards</span>
            <span slText tone="muted" [id]="id() + '-billing'">Billing</span>
          </div>
        </nav>
      }
      <div slStack [gap]="4">
        <div slInline [gap]="3" wrap="wrap">
          <div slTextField [id]="id() + '-search'">
            <input
              slTextFieldInput
              type="search"
              aria-label="Search reports"
              placeholder="Search reports"
            />
          </div>
          <button slButton tone="secondary" variant="outline" [id]="id() + '-filters'">
            Filters
          </button>
          <button slButton tone="secondary" variant="outline" [id]="id() + '-views'">
            Saved views
          </button>
          <button slButton tone="secondary" variant="outline" [id]="id() + '-share'">Share</button>
          <button slButton tone="accent" [id]="id() + '-export'">Export</button>
          <button slButton tone="accent" variant="outline" [id]="id() + '-new'">New report</button>
          <ng-content select="[toolbar]" />
        </div>
        <ng-content />
        <div slStack [gap]="2">
          @for (report of reports; track report) {
            <span slText>{{ report }}</span>
          }
        </div>
      </div>
    </div>
  </div>`,
})
class ScreenDemo {
  readonly id = input.required<string>();
  readonly sidebar = input(true);
  protected readonly reports = REPORTS;
}

/** A screen, the button that starts its tour, and the last request written under it. */
@Component({
  selector: 'sl-tour-demo',
  standalone: true,
  imports: [ScreenDemo, SlButton, SlInline, SlStack, SlText, SlTour],
  template: `<div slStack [gap]="4">
    <div slInline align="center" [gap]="3" wrap="wrap">
      <button slButton (click)="open.set(true)">{{ label() }}</button>
      <ng-content select="[controls]" />
    </div>
    <sl-tour-screen [id]="id()" [sidebar]="sidebar()">
      <ng-content />
    </sl-tour-screen>
    <p slText size="sm" tone="muted">{{ last() }}</p>
    <sl-tour
      [steps]="steps() ?? defaultSteps()"
      [(open)]="open"
      [modal]="modal()"
      [layout]="layout()"
      [missing]="missing()"
      [closeOnOutsidePress]="closeOnOutsidePress()"
      [messages]="messages()"
      (openChangeRequest)="onOpen($event)"
      (stepChangeRequest)="onStep($event)"
    />
  </div>`,
})
class TourDemo {
  readonly id = input.required<string>();
  readonly label = input('Start tour');
  readonly sidebar = input(true);
  readonly steps = input<readonly TourStep[] | undefined>(undefined);
  readonly modal = input<boolean | undefined>(undefined);
  readonly missing = input<TourMissing | undefined>(undefined);
  readonly layout = input<TourLayout | undefined>(undefined);
  readonly closeOnOutsidePress = input<boolean | undefined>(undefined);
  readonly messages = input<PartialMessages<TourMessages> | undefined>(undefined);
  /** Opens at once: the story's own page shows the tour, the reference page waits for Start. */
  readonly startOpen = input(false);
  protected readonly open = signal(false);

  ngOnInit() {
    this.open.set(this.startOpen());
  }
  protected readonly last = signal('No request yet.');
  protected readonly defaultSteps = computed(() => tourOf(this.id()));

  protected onOpen(request: TourOpenRequest) {
    const outcome = request.outcome === undefined ? '' : `, outcome: ${request.outcome}`;
    this.last.set(
      `openChangeRequest(${String(request.value)}) — reason: ${request.reason}${outcome}`,
    );
  }

  protected onStep(request: TourStepRequest) {
    this.last.set(`stepChangeRequest(${request.value ?? 'null'}) — reason: ${request.reason}`);
  }
}

/** The opening card, with its picture written as a template for the step. */
@Component({
  selector: 'sl-tour-centered-demo',
  standalone: true,
  imports: [ScreenDemo, SlButton, SlStack, SlTour, SlTourStep],
  template: `<div slStack [gap]="4">
    <div><button slButton (click)="open.set(true)">Start tour</button></div>
    <sl-tour-screen id="centered" />
    <sl-tour [steps]="steps" [(open)]="open">
      <ng-template slTourStep="welcome" slTourStepSlot="media">
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
          <rect
            fill="var(--slotted-tone-accent-solid)"
            height="10"
            rx="5"
            width="96"
            x="56"
            y="44"
          />
          <rect
            fill="var(--slotted-tone-accent-border)"
            height="8"
            rx="4"
            width="176"
            x="56"
            y="64"
          />
        </svg>
      </ng-template>
    </sl-tour>
  </div>`,
})
class CenteredDemo {
  protected readonly open = signal(false);
  protected readonly steps = tourOf('centered');
}

/** The spotlight tour, and a coach mark with neither spotlight nor modality. */
@Component({
  selector: 'sl-tour-spotlight-demo',
  standalone: true,
  imports: [TourDemo, SlButton, SlTour],
  template: `<sl-tour-demo id="spotlight">
      <button controls slButton tone="secondary" variant="outline" (click)="tip.set(true)">
        Show tip
      </button>
    </sl-tour-demo>
    <sl-tour [steps]="steps" [(open)]="tip" [modal]="false" [spotlight]="false" size="sm" />`,
})
class SpotlightDemo {
  protected readonly tip = signal(false);
  protected readonly steps: TourStep[] = [
    {
      id: 'views',
      target: '#spotlight-views',
      title: 'Keep this view',
      description: 'Save the filters and columns you use every week.',
      messages: { done: 'Got it' },
    },
  ];
}

/** Billing, for owners only. */
@Component({
  selector: 'sl-tour-availability-demo',
  standalone: true,
  imports: [TourDemo, SlSegment, SlSegmentedControl],
  template: `<sl-tour-demo id="availability" [steps]="steps">
    <div
      controls
      slSegmentedControl
      aria-label="Role"
      size="sm"
      [value]="role()"
      (valueChange)="role.set($event.value ?? 'viewer')"
    >
      <label slSegment value="viewer">Viewer</label>
      <label slSegment value="owner">Owner</label>
    </div>
  </sl-tour-demo>`,
})
class AvailabilityDemo {
  protected readonly role = signal('viewer');
  protected readonly steps: TourStep[] = [
    { id: 'search', target: fieldOf('availability-search'), title: 'Find any report' },
    {
      id: 'billing',
      target: '#availability-billing',
      side: 'inline-end',
      title: 'Invoices and plans',
      description: 'Only owners see billing.',
      when: () => this.role() === 'owner',
    },
    { id: 'share', target: '#availability-share', title: 'Share with your team' },
    { id: 'export', target: '#availability-export', title: 'Export what you see' },
  ];
}

/** The sidebar is collapsed, under either policy. */
@Component({
  selector: 'sl-tour-missing-demo',
  standalone: true,
  imports: [TourDemo, SlSegment, SlSegmentedControl],
  template: `<sl-tour-demo id="missing" [sidebar]="false" [missing]="policy()" [steps]="steps">
    <div
      controls
      slSegmentedControl
      aria-label="When a target is missing"
      size="sm"
      [value]="policy()"
      (valueChange)="policy.set($any($event.value) ?? 'center')"
    >
      <label slSegment value="center">center</label>
      <label slSegment value="skip">skip</label>
    </div>
  </sl-tour-demo>`,
})
class MissingDemo {
  protected readonly policy = signal<TourMissing>('center');
  protected readonly steps: TourStep[] = [
    { id: 'search', target: fieldOf('missing-search'), title: 'Find any report' },
    {
      id: 'nav',
      target: '#missing-nav',
      title: 'Find it all in the sidebar',
      description: 'Every report, dashboard and saved view is one click away from the menu.',
    },
    { id: 'export', target: '#missing-export', title: 'Export what you see' },
  ];
}

/** The column menu opens before its step. */
@Component({
  selector: 'sl-tour-prepare-demo',
  standalone: true,
  imports: [TourDemo, SlStack, SlText],
  template: `<sl-tour-demo id="prepare" [steps]="steps">
    @if (menu()) {
      <div class="slotted-demo-surface" data-surface="sunken" id="prepare-columns">
        <div slStack [gap]="2">
          <span slText weight="semibold">Columns</span>
          <span slText>Report · Owner · Updated · Views</span>
        </div>
      </div>
    }
  </sl-tour-demo>`,
})
class PrepareDemo {
  protected readonly menu = signal(false);
  protected readonly steps: TourStep[] = [
    { id: 'search', target: fieldOf('prepare-search'), title: 'Find any report' },
    {
      id: 'columns',
      target: '#prepare-columns',
      title: 'Choose your columns',
      description: 'Show, hide and reorder what the list shows.',
      prepare: (signal) =>
        new Promise<void>((resolve) => {
          this.menu.set(true);
          const timer = window.setTimeout(resolve, 1000);
          signal.addEventListener('abort', () => window.clearTimeout(timer));
        }),
    },
    { id: 'export', target: '#prepare-export', title: 'Export what you see' },
  ];
}

/** The product resumes, refuses and records. */
@Component({
  selector: 'sl-tour-controlled-demo',
  standalone: true,
  imports: [ScreenDemo, SlButton, SlInline, SlStack, SlText, SlTour],
  template: `<div slStack [gap]="4">
    <div slInline align="center" [gap]="3" wrap="wrap">
      <button slButton (click)="open.set(true)">Resume tour</button>
      <button slButton tone="secondary" variant="outline" (click)="filtered.set(!filtered())">
        {{ filtered() ? 'Remove the filter' : 'Apply a filter' }}
      </button>
      <span slText tone="muted">step: {{ step() ?? 'null' }} · filtered: {{ filtered() }}</span>
    </div>
    <sl-tour-screen id="controlled" />
    <div slStack [gap]="1">
      @for (line of log(); track $index) {
        <span slText size="sm" tone="muted">{{ line }}</span>
      }
    </div>
    <sl-tour
      [steps]="steps"
      [(open)]="open"
      [(step)]="step"
      (openChangeRequest)="onOpen($event)"
      (stepChangeRequest)="onStep($event)"
    />
  </div>`,
})
class ControlledDemo {
  protected readonly open = signal(false);
  protected readonly step = signal<string | null>('filters');
  protected readonly filtered = signal(false);
  protected readonly log = signal<string[]>([]);
  protected readonly steps = tourOf('controlled');

  private record(line: string) {
    this.log.update((lines) => [line, ...lines].slice(0, 4));
  }

  protected onOpen(request: TourOpenRequest) {
    this.record(
      `openChangeRequest(${String(request.value)}) — reason: ${request.reason}${request.outcome ? `, outcome: ${request.outcome}` : ''}`,
    );
  }

  protected onStep(request: TourStepRequest) {
    if (this.step() === 'filters' && request.value === 'share' && !this.filtered()) {
      this.record('Refused: apply a filter first.');
      request.cancel();
      return;
    }
    this.record(`stepChangeRequest(${request.value ?? 'null'}) — reason: ${request.reason}`);
  }
}

/** The product's own card. */
@Component({
  selector: 'sl-tour-composition-demo',
  standalone: true,
  imports: [
    ScreenDemo,
    SlButton,
    SlStack,
    SlText,
    SlTour,
    SlTourCard,
    SlTourContent,
    SlTourDescription,
    SlTourFooter,
    SlTourNext,
    SlTourTitle,
  ],
  template: `<div slStack [gap]="4">
    <div><button slButton (click)="open.set(true)">Start tour</button></div>
    <sl-tour-screen id="composition">
      @if (guide()) {
        <span slText tone="muted">The guide would open in a side panel here.</span>
      }
    </sl-tour-screen>
    <sl-tour #tour="slTour" [steps]="steps" [(open)]="open">
      <ng-template slTourCard>
        <div slTourContent>
          <h3 slTourTitle></h3>
          <p slTourDescription></p>
          <div slTourFooter>
            <span slText aria-hidden="true" tone="muted">{{
              dots(tour.position(), tour.total())
            }}</span>
            <button slButton size="sm" tone="secondary" variant="ghost" (click)="guide.set(true)">
              Read the guide
            </button>
            <button slButton slTourNext size="sm" tone="accent">
              {{ tour.t(tour.last() ? 'done' : 'next') }}
            </button>
          </div>
        </div>
      </ng-template>
    </sl-tour>
  </div>`,
})
class CompositionDemo {
  protected readonly open = signal(false);
  protected readonly guide = signal(false);
  protected readonly steps = tourOf('composition').slice(1);

  protected dots(position: number, total: number) {
    return '●'.repeat(position) + '○'.repeat(Math.max(0, total - position));
  }
}

/** The language, once for the application. */
@Component({
  selector: 'sl-tour-provided-demo',
  standalone: true,
  imports: [TourDemo],
  providers: [provideSlotted({ locale: 'pt-BR' })],
  template: `<sl-tour-demo id="labels-pt" label="Iniciar tour" [steps]="steps" />`,
})
class ProvidedDemo {
  protected readonly steps: TourStep[] = [
    { id: 'search', target: fieldOf('labels-pt-search'), title: 'Find any report' },
    { id: 'filters', target: '#labels-pt-filters', title: 'Refine the list' },
    { id: 'share', target: '#labels-pt-share', title: 'Share with the team' },
    { id: 'export', target: '#labels-pt-export', title: 'Export what you see' },
  ];
}

/** Start from anywhere a template reaches the instance. */
@Component({
  selector: 'sl-tour-keyboard-demo',
  standalone: true,
  imports: [ScreenDemo, SlButton, SlInline, SlStack, SlTour],
  template: `<div slStack [gap]="4">
    <div slInline [gap]="3">
      <button slButton (click)="tour.start()">Start tour</button>
      <button slButton tone="secondary" variant="outline" (click)="tour.start('share')">
        Start at Share
      </button>
    </div>
    <sl-tour-screen id="keyboard" />
    <sl-tour #tour="slTour" [steps]="steps" />
  </div>`,
})
class KeyboardDemo {
  protected readonly steps = tourOf('keyboard');
}

/** Corners, edges and a target that fills the screen. */
@Component({
  selector: 'sl-tour-edges-demo',
  standalone: true,
  imports: [SlButton, SlInline, SlStack, SlText, SlTour],
  template: `<div slStack [gap]="4">
    <div><button slButton (click)="open.set(true)">Start tour</button></div>
    <div slStack [gap]="6">
      <div slInline justify="between">
        <button slButton id="edges-alerts" tone="secondary" variant="outline">Notifications</button>
        <button slButton id="edges-account" tone="secondary" variant="outline">Account</button>
      </div>
      <div class="slotted-demo-viewport" data-size="screen" id="edges-chart">
        <span slText tone="muted">Revenue by region, last twelve months</span>
      </div>
      <div slInline justify="between">
        <button slButton id="edges-help" tone="secondary" variant="outline">Help</button>
        <button slButton id="edges-feedback" tone="secondary" variant="outline">Feedback</button>
      </div>
    </div>
    <sl-tour [steps]="steps" [(open)]="open" />
  </div>`,
})
class EdgesDemo {
  protected readonly open = signal(false);
  protected readonly steps: TourStep[] = [
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
      description: 'Taller than the room around it: the card is centred over it.',
    },
    {
      id: 'feedback',
      target: '#edges-feedback',
      side: 'bottom',
      align: 'end',
      title: 'Feedback',
      description: 'Asked for the bottom at the foot of the page: it flips above.',
    },
  ];
}

/** A tour through a dialog one of its steps opens. */
@Component({
  selector: 'sl-tour-layers-demo',
  standalone: true,
  imports: [
    ScreenDemo,
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogFooter,
    SlDialogHeader,
    SlDialogTitle,
    SlInline,
    SlStack,
    SlTextField,
    SlTextFieldInput,
    SlTour,
  ],
  template: `<div slStack [gap]="4">
    <div slInline [gap]="3">
      <button slButton (click)="open.set(true)">Start tour</button>
      <button
        slButton
        id="layers-invite"
        tone="secondary"
        variant="outline"
        (click)="invite.set(true)"
      >
        Invite people
      </button>
    </div>
    <sl-tour-screen id="layers" />
    <sl-dialog [(open)]="invite">
      <header slDialogHeader><h2 slDialogTitle>Invite people</h2></header>
      <div slDialogBody>
        <div slTextField id="layers-emails">
          <input slTextFieldInput aria-label="Emails" placeholder="ana@example.com" />
        </div>
      </div>
      <footer slDialogFooter><button slButton id="layers-send">Send invites</button></footer>
    </sl-dialog>
    <sl-tour [steps]="steps" [(open)]="open" />
  </div>`,
})
class LayersDemo {
  protected readonly open = signal(false);
  protected readonly invite = signal(false);
  protected readonly steps: TourStep[] = [
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
          this.invite.set(true);
          window.setTimeout(resolve, 300);
        }),
    },
    {
      id: 'send',
      target: '#layers-send',
      title: 'Send when ready',
      description: 'Invitations expire after seven days.',
    },
  ];
}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

const one = (label: string, note: string, body: string) => ({
  template: grid(scene(label, note, body)),
});

const GERMAN_MESSAGES: PartialMessages<TourMessages> = {
  done: 'Fertig',
  next: 'Weiter',
  prev: 'Zurück',
  progress: 'Schritt {position} von {total} in der Einführung',
  skip: 'Tour überspringen',
};

const GERMAN_STEPS: TourStep[] = [
  {
    id: 'rules',
    target: '#labels-de-new',
    title: 'Automatisierungsregelverwaltungsoberfläche',
    description: 'Regeln laufen, wenn sich ein Bericht ändert.',
  },
  { id: 'export', target: '#labels-de-export', title: 'Exportieren, was Sie sehen' },
];

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_TOUR_DOCS.tour.scenes, {
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

const meta: Meta = {
  title: 'Components/Tour',
  decorators: [
    moduleMetadata({
      imports: [
        TourDemo,
        CenteredDemo,
        SpotlightDemo,
        AvailabilityDemo,
        MissingDemo,
        PrepareDemo,
        ControlledDemo,
        CompositionDemo,
        ProvidedDemo,
        KeyboardDemo,
        EdgesDemo,
        LayersDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Tour',
        description:
          'A guided walk through an interface, one step at a time: a card beside each target and a spotlight that says which one. Steps may be conditional, may prepare the page, may wait for the reader to act, and survive a target that is not there; the tour is modal, with the page inert behind it, or a coach mark that leaves the page alone. Closing says how the tour ended, so the product can decide whether to offer it again.',
        framework: 'Angular',
        ...ANGULAR_TOUR_DOCS.tour,
        tokens: ANGULAR_TOUR_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => ({
    props: { pictured: context.viewMode === 'story' },
    ...one(
      'The five stops of a reports workspace',
      'Start it, walk it with Next and Back, and read the last request under the screen. The card follows the spotlight from the search field to Export.',
      `<sl-tour-demo id="playground" [startOpen]="pictured" />`,
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    props: {
      steps: [
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
      ] satisfies TourStep[],
    },
    ...one(
      'A side for every target',
      'The sidebar step stands beside the navigation, the export step above its button, aligned to its end; the others below. Narrow the window and watch them flip and slide.',
      `<sl-tour-demo id="placement" [steps]="steps" />`,
    ),
  }),
};

export const Centered: Story = {
  parameters: scenario('centered'),
  render: () =>
    one(
      'The opening card',
      'No target: the card stands in the middle over the whole scrim, with a picture as its media and its own labels. The next step takes the spotlight to the search field.',
      `<sl-tour-centered-demo />`,
    ),
};

export const Spotlight: Story = {
  parameters: scenario('spotlight'),
  render: () =>
    one(
      'The spotlight, and the coach mark without one',
      'Start tour cuts each target out of the scrim and moves the cutout from one to the next. Show tip is a single non-modal card with no spotlight: the page stays bright and usable.',
      `<sl-tour-spotlight-demo />`,
    ),
};

export const Modal: Story = {
  parameters: scenario('modal'),
  render: () => ({
    template: grid(
      scene(
        'Modal: the page is out of reach',
        'Try to click the search field or Tab out of the card: the page is inert, Tab cycles inside the card, and only Escape, Skip or the close control leave.',
        `<sl-tour-demo id="modal-on" />`,
      ) +
        scene(
          'Not modal: the page stays reachable',
          'modal false with closeOnOutsidePress: the scrim still dims, but the page answers the pointer and the keyboard, and a press outside the card closes the tour.',
          `<sl-tour-demo id="modal-off" [modal]="false" [closeOnOutsidePress]="true" />`,
        ),
    ),
  }),
};

export const Interactive: Story = {
  parameters: scenario('interactive'),
  render: () => ({
    props: {
      steps: [
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
      ] satisfies TourStep[],
    },
    ...one(
      'Press New report to go on',
      'The step is interactive, so New report stays operable in the spotlight and the step is not modal. Next is gone: pressing the target is what advances, and Tab from the card reaches it.',
      `<sl-tour-demo id="interactive" [steps]="steps" />`,
    ),
  }),
};

export const Availability: Story = {
  parameters: scenario('availability'),
  render: () =>
    one(
      'Billing, for owners only',
      'As a viewer the tour has three steps and “1 of 3”; switch to owner and the billing step joins, “1 of 4”. Next and Back pass over it in both directions while it does not apply.',
      `<sl-tour-availability-demo />`,
    ),
};

export const Missing: Story = {
  parameters: scenario('missing'),
  render: () =>
    one(
      'The sidebar is collapsed',
      'The sidebar step has nothing to point at. Under center it stands in the middle with data-missing and no spotlight, and the reader keeps going; under skip it is passed over and not counted.',
      `<sl-tour-missing-demo />`,
    ),
};

export const Prepare: Story = {
  parameters: scenario('prepare'),
  render: () =>
    one(
      'Opening the column menu before its step',
      'Next on the first step runs prepare: the menu opens, the columns load for a second, and Next carries its loading sweep until the menu — the step’s target — is on the page.',
      `<sl-tour-prepare-demo />`,
    ),
};

export const Controlled: Story = {
  parameters: scenario('controlled'),
  render: () =>
    one(
      'Resume, refuse and record',
      'The product starts the tour at the step it saved, filters. Next is refused until a filter is applied; closing writes the outcome the product would store to decide whether to offer the tour again.',
      `<sl-tour-controlled-demo />`,
    ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () =>
    one(
      'The product’s own card',
      'Dots from the slTour instance in place of the progress text, a Read the guide action beside Next, and the title rendered as an h3 because the page already has its h2.',
      `<sl-tour-composition-demo />`,
    ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => ({
    props: { messages: GERMAN_MESSAGES, steps: GERMAN_STEPS },
    template: grid(
      scene(
        'In Portuguese, once for the application',
        'The language in force says Next, Back, Done, Skip tour, Close tour and “2 of 4”; every tour under the provider reads them.',
        `<sl-tour-provided-demo />`,
      ) +
        scene(
          'A long German title and progress',
          'Automatisierungsregelverwaltungsoberfläche is one unbroken word and “Schritt 1 von 2 in der Einführung” a long progress: both wrap inside the card, which keeps its measure.',
          `<sl-tour-demo id="labels-de" [messages]="messages" [steps]="steps" />`,
        ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () =>
    one(
      'Start, walk and leave without the pointer',
      'Tab to Start tour and press Enter: focus is on the card. ArrowRight and ArrowLeft go on and back — mirrored right to left — Tab reaches the buttons, and Escape gives focus back to Start tour.',
      `<sl-tour-keyboard-demo />`,
    ),
};

export const Compact: Story = {
  parameters: scenario('compact'),
  render: () => ({
    props: {
      steps: [
        {
          id: 'nav',
          target: '#compact-nav',
          side: 'inline-end',
          title: 'Every workspace',
          description: 'Reports, dashboards and billing, one tap away.',
        },
        { id: 'search', target: fieldOf('compact-search'), title: 'Find any report' },
        { id: 'export', target: '#compact-export', title: 'Export what you see' },
      ] satisfies TourStep[],
    },
    ...one(
      'The phone composition',
      'The compact layout forces what a viewport under 600 pixels gets by itself: the sidebar step asked for inline-end and stands below its target instead, and every card is as wide as the room allows.',
      `<div class="slotted-demo-room" data-room="phone"><sl-tour-demo id="compact" layout="compact" [steps]="steps" /></div>`,
    ),
  }),
};

export const Edges: Story = {
  parameters: scenario('edges'),
  render: () =>
    one(
      'Corners, edges and a target that fills the screen',
      'Each corner step asks for the side that has no room: the card flips and slides along the edge and the arrow keeps pointing. The chart leaves no side tall enough, so its card is centred over it and the spotlight still frames it.',
      `<sl-tour-edges-demo />`,
    ),
};

export const Layers: Story = {
  parameters: scenario('layers'),
  render: () =>
    one(
      'A tour through the invite dialog',
      'The second step opens the dialog in its prepare and points at the emails field inside it; the tour stays on top and the dialog is what goes inert. Escape closes the tour and leaves the dialog open, where the reader was.',
      `<sl-tour-layers-demo />`,
    ),
};
