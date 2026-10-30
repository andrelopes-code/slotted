import { Component, signal } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlButton } from '@slotted/angular/button';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlHoverCard } from './hover-card';
import { provideHoverCardDefaults } from './hover-card-defaults';
import { SlHoverCardTrigger } from './hover-card-trigger';
import { ANGULAR_HOVER_CARD_DOCS, ANGULAR_HOVER_CARD_TOKENS } from './hover-card.docs';

interface HoverCardStoryArgs {
  closeDelay: number;
  disabled: boolean;
  navigable: boolean;
  openDelay: number;
  side: 'top' | 'bottom' | 'inline-start' | 'inline-end';
  align: 'start' | 'center' | 'end';
}

interface Person {
  handle: string;
  name: string;
  team: string;
  bio: string;
  meta: string;
}

const PEOPLE: Record<string, Person> = {
  'ana.souza': {
    handle: 'ana.souza',
    name: 'Ana Souza',
    team: 'Product, Billing',
    bio: 'Runs pricing and packaging. Reviews every change to the plans page before it ships.',
    meta: '18 open reviews · Seattle, 14:05',
  },
  'marcus.lee': {
    handle: 'marcus.lee',
    name: 'Marcus Lee',
    team: 'Design, Growth',
    bio: 'Owns the checkout flow and the copy in it.',
    meta: '4 open reviews · Toronto, 13:05',
  },
  'priya.natarajan': {
    handle: 'priya.natarajan',
    name: 'Priya Natarajan',
    team: 'Legal',
    bio: 'Reads every contract clause that reaches a customer.',
    meta: '2 open reviews · London, 18:05',
  },
  'konstantinos.papadimitriou': {
    handle: 'konstantinos.papadimitriou',
    name: 'Konstantinos Papadimitriou',
    team: 'Platform Infrastructure',
    bio: 'Staff engineer on the payments platform since 2019. Owns the ledger service, the reconciliation jobs and the on-call rotation for the European region.',
    meta: '31 open reviews · Athens, 20:05',
  },
};

const ANA = PEOPLE['ana.souza'] as Person;

/** The body of a person's card: avatar, name, team, bio and a line of facts. Written for a template. */
const personBody = (person: Person) => `
  <div slPopoverBody>
    <div class="slotted-demo-row">
      <span slAvatar name="${person.name}" size="lg"></span>
      <div class="slotted-demo-stack">
        <span slText weight="semibold">${person.name}</span>
        <span slText size="sm" tone="muted">&#64;${person.handle} · ${person.team}</span>
      </div>
    </div>
    <p slText size="sm">${person.bio}</p>
    <p slText size="xs" tone="muted">${person.meta}</p>
  </div>
`;

/** A mention and its card, `[portal]="false"` inside the workbench's viewport box. */
const mention = (person: Person, attributes = '') => `
  <ng-container slHoverCard [portal]="false" ${attributes}>
    <a slHoverCardTrigger href="/people/${person.handle}">&#64;${person.handle}</a>
    <ng-template slPopoverLayer>
      <div slPopoverContent>
        ${personBody(person)}
        <div slPopoverArrow></div>
      </div>
    </ng-template>
  </ng-container>
`;

const viewport = (body: string, size: 'layer' | 'tall' = 'tall') => `
  <div class="slotted-demo-viewport" data-place="top" data-size="${size}">${body}</div>
`;

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>
`;

/** One card, many mentions: the request names the trigger, and the card fills from one state. */
@Component({
  selector: 'sl-demo-hover-card-shared',
  standalone: true,
  imports: [
    SlAvatar,
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverLayer,
    SlText,
  ],
  template: `
    <div class="slotted-demo-viewport" data-place="top" data-size="tall">
      <ng-container slHoverCard [portal]="false" (openChangeRequest)="remember($event)">
        <p slText>
          Thread:
          <a slHoverCardTrigger data-handle="ana.souza" href="/people/ana.souza">&#64;ana.souza</a>
          asked
          <a slHoverCardTrigger data-handle="marcus.lee" href="/people/marcus.lee"
            >&#64;marcus.lee</a
          >
          for the copy,
          <a slHoverCardTrigger data-handle="priya.natarajan" href="/people/priya.natarajan"
            >&#64;priya.natarajan</a
          >
          for the clause, and
          <a
            slHoverCardTrigger
            data-handle="konstantinos.papadimitriou"
            href="/people/konstantinos.papadimitriou"
            >&#64;konstantinos.papadimitriou</a
          >
          for the ledger.
        </p>
        <ng-template slPopoverLayer>
          <div slPopoverContent>
            <div slPopoverBody>
              <div class="slotted-demo-row">
                <span slAvatar [name]="person().name" size="lg"></span>
                <div class="slotted-demo-stack">
                  <span slText weight="semibold">{{ person().name }}</span>
                  <span slText size="sm" tone="muted"
                    >&#64;{{ person().handle }} · {{ person().team }}</span
                  >
                </div>
              </div>
              <p slText size="sm">{{ person().bio }}</p>
              <p slText size="xs" tone="muted">{{ person().meta }}</p>
            </div>
            <div slPopoverArrow></div>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class SharedDemo {
  readonly handle = signal('ana.souza');
  readonly person = () => PEOPLE[this.handle()] ?? ANA;

  remember(request: { value: boolean; source?: unknown }) {
    const target = (request.source as Event | undefined)?.currentTarget;
    if (request.value && target instanceof HTMLElement) {
      this.handle.set(target.dataset['handle'] ?? 'ana.souza');
    }
  }
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_HOVER_CARD_DOCS.hoverCard.scenes, {
    composition: Composition,
    delay: Delay,
    keyboard: Keyboard,
    'link-preview': LinkPreview,
    mention: Mention,
    navigable: Navigable,
    playground: Playground,
    shared: Shared,
    touch: Touch,
  }) as never;

const meta: Meta<HoverCardStoryArgs> = {
  title: 'Components/Hover card',
  decorators: [
    moduleMetadata({
      imports: [
        SharedDemo,
        SlAvatar,
        SlButton,
        SlHoverCard,
        SlHoverCardTrigger,
        SlPopoverArrow,
        SlPopoverBody,
        SlPopoverClose,
        SlPopoverContent,
        SlPopoverDescription,
        SlPopoverFooter,
        SlPopoverHeader,
        SlPopoverLayer,
        SlPopoverTitle,
        SlText,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Hover card',
        description:
          'A preview of a link or a person, opened by hover and by focus. The trigger is the family; the card is the popover family unchanged, with focus never taken.',
        framework: 'Angular',
        ...ANGULAR_HOVER_CARD_DOCS.hoverCard,
        tokens: ANGULAR_HOVER_CARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<HoverCardStoryArgs>;

export const Playground: Story = {
  args: {
    closeDelay: 300,
    disabled: false,
    navigable: false,
    openDelay: 600,
    side: 'bottom',
    align: 'start',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: viewport(`
      <p slText>
        Looks good to me.
        ${mention(
          ANA,
          '[open]="true" [openDelay]="openDelay" [closeDelay]="closeDelay" [navigable]="navigable" [disabled]="disabled" [side]="side" [align]="align"',
        )}
        owns the follow-up on the pricing table.
      </p>
    `),
  }),
};

export const Mention: Story = {
  parameters: scenario('mention'),
  render: () => ({
    template: viewport(`
      <p slText>
        ${mention(ANA, '[open]="true"')} owns the follow-up on the pricing table, and the copy
        review goes to ${mention(PEOPLE['marcus.lee'] as Person)} once the numbers land.
      </p>
    `),
  }),
};

export const LinkPreview: Story = {
  parameters: scenario('link-preview'),
  render: () => ({
    template: viewport(`
      <p slText>
        Spec:
        <ng-container slHoverCard [open]="true" [portal]="false">
          <a slHoverCardTrigger href="/specs/checkout-pricing">Checkout redesign — pricing table</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverHeader>
                <div slPopoverTitle>Checkout redesign — pricing table</div>
                <p slPopoverDescription>Product spec · updated 2 hours ago by Ana Souza</p>
              </div>
              <div slPopoverBody>
                Three tiers with annual and monthly toggles, a usage estimator under the enterprise
                column, and the comparison table folded behind a disclosure on narrow screens.
              </div>
              <div slPopoverArrow></div>
            </div>
          </ng-template>
        </ng-container>
        (draft 4, waiting on legal).
      </p>
    `),
  }),
};

export const Navigable: Story = {
  parameters: scenario('navigable'),
  render: () => ({
    template: viewport(`
      <p slText>
        Assigned to
        <ng-container slHoverCard navigable [open]="true" [portal]="false">
          <a slHoverCardTrigger href="/people/ana.souza">&#64;ana.souza</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverHeader>
                <div slPopoverTitle>Ana Souza</div>
                <p slPopoverDescription>&#64;ana.souza · Product, Billing</p>
              </div>
              <div slPopoverBody>${ANA.bio}</div>
              <div slPopoverFooter>
                <button slButton size="sm" variant="outline">Message</button>
                <button slButton size="sm">Follow</button>
              </div>
              <div slPopoverArrow></div>
            </div>
          </ng-template>
        </ng-container>
        for review — Tab from the mention to reach Follow.
      </p>
    `),
  }),
};

export const Delay: Story = {
  parameters: scenario('delay'),
  render: () => ({
    template: `
      <div class="slotted-demo-grid" data-columns="2">
        ${scene(
          '600 / 300',
          'The defaults: a pointer crossing the line opens nothing.',
          viewport(`<p slText>Reviewed by ${mention(ANA)}.</p>`),
        )}
        ${scene(
          '0 / 1000',
          'At once, and it lingers for a second after the pointer leaves.',
          viewport(
            `<p slText>Reviewed by ${mention(PEOPLE['marcus.lee'] as Person, '[openDelay]="0" [closeDelay]="1000"')}.</p>`,
          ),
        )}
      </div>
    `,
  }),
};

export const Shared: Story = {
  parameters: scenario('shared'),
  render: () => ({ template: `<sl-demo-hover-card-shared />` }),
};

export const Touch: Story = {
  parameters: scenario('touch'),
  render: () => ({
    template: viewport(`
      <p slText>
        On a touch screen, tap ${mention(ANA, '[open]="true"')} once to see the card and again to open the profile.
      </p>
    `),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [moduleMetadata({ providers: [provideHoverCardDefaults({ openDelay: 400 })] })],
  render: () => ({
    template: viewport(`
      <p slText>
        Approved by
        <ng-container slHoverCard [open]="true" [portal]="false">
          <a slHoverCardTrigger href="/people/ana.souza" data-part="mention" data-part-mention="">Ana Souza</a>
          <ng-template slPopoverLayer>
            <div slPopoverContent>
              <div slPopoverHeader>
                <div slPopoverTitle>Ana Souza</div>
                <p slPopoverDescription>&#64;ana.souza · Product, Billing</p>
                <button slPopoverClose></button>
              </div>
              <div slPopoverBody>${ANA.bio}</div>
              <div slPopoverArrow></div>
            </div>
          </ng-template>
        </ng-container>
        on Monday.
      </p>
    `),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: viewport(`
      <p slText>
        Tab onto ${mention(ANA)} and the card opens at once; Escape closes it; Tab on closes it
        with blur.
      </p>
    `),
  }),
};
