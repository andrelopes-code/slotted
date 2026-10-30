import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Link } from '../link';
import {
  PopoverBody,
  PopoverClose,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from '../popover';
import { Text } from '../typography';
import type { TextProps } from '../typography';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { HoverCardDefaultsProvider } from './hover-card-defaults';
import { REACT_HOVER_CARD_DOCS, REACT_HOVER_CARD_TOKENS } from './hover-card.docs';
import type { HoverCardProps } from './hover-card.types';

/**
 * Every card here opens `portal={false}` inside the workbench's own viewport
 * box, so a card opened in one scene cannot draw over the scene above it.
 */
const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

const Viewport = ({ children, size }: { children: ReactNode; size?: 'layer' | 'tall' }) => (
  <div className="slotted-demo-viewport" data-place="top" data-size={size ?? 'tall'}>
    {children}
  </div>
);

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

/** The body of a person's card: avatar, name, team, bio and a line of facts. */
/** A line of text as a paragraph: the popover body stacks blocks, and a span would run on. */
const Line = (props: TextProps) => <Text {...props} render={(rest) => <p {...rest} />} />;

const PersonBody = ({ person }: { person: Person }) => (
  <PopoverBody>
    <div className="slotted-demo-stack">
      <div className="slotted-demo-row">
        <Avatar name={person.name} size="lg" />
        <div className="slotted-demo-stack">
          <Text weight="semibold">{person.name}</Text>
          <Text size="sm" tone="muted">
            @{person.handle} · {person.team}
          </Text>
        </div>
      </div>
      <Line size="sm">{person.bio}</Line>
      <Line size="xs" tone="muted">
        {person.meta}
      </Line>
    </div>
  </PopoverBody>
);

const Mention = ({ person, ...props }: { person: Person } & Partial<HoverCardProps>) => (
  <HoverCard portal={false} {...props}>
    <HoverCardTrigger href={`/people/${person.handle}`}>@{person.handle}</HoverCardTrigger>
    <HoverCardContent>
      <PersonBody person={person} />
    </HoverCardContent>
  </HoverCard>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_HOVER_CARD_DOCS.hoverCard.scenes, {
    composition: Composition,
    delay: Delay,
    keyboard: Keyboard,
    'link-preview': LinkPreview,
    mention: MentionScene,
    navigable: Navigable,
    playground: Playground,
    shared: Shared,
    touch: Touch,
  }) as never;

const meta = {
  title: 'Components/Hover card',
  component: HoverCard,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Hover card',
        description:
          'A preview of a link or a person, opened by hover and by focus. The trigger is the family; the card is the popover family unchanged, with focus never taken.',
        framework: 'React',
        ...REACT_HOVER_CARD_DOCS.hoverCard,
        tokens: REACT_HOVER_CARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  render: (args) => (
    <Viewport>
      <Text>
        Looks good to me. <Mention person={ANA} {...args} defaultOpen /> owns the follow-up on the
        pricing table.
      </Text>
    </Viewport>
  ),
};

export const MentionScene: Story = {
  parameters: scenario('mention'),
  render: () => (
    <Viewport>
      <Text>
        <Mention person={ANA} defaultOpen /> owns the follow-up on the pricing table, and the copy
        review goes to <Mention person={PEOPLE['marcus.lee'] as Person} /> once the numbers land.
      </Text>
    </Viewport>
  ),
};

export const LinkPreview: Story = {
  parameters: scenario('link-preview'),
  render: () => (
    <Viewport>
      <Text>
        Spec:{' '}
        <HoverCard defaultOpen portal={false}>
          <HoverCardTrigger href="/specs/checkout-pricing">
            Checkout redesign — pricing table
          </HoverCardTrigger>
          <HoverCardContent>
            <PopoverHeader>
              <PopoverTitle>Checkout redesign — pricing table</PopoverTitle>
              <PopoverDescription>
                Product spec · updated 2 hours ago by Ana Souza
              </PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              Three tiers with annual and monthly toggles, a usage estimator under the enterprise
              column, and the comparison table folded behind a disclosure on narrow screens.
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>{' '}
        (draft 4, waiting on legal).
      </Text>
    </Viewport>
  ),
};

export const Navigable: Story = {
  parameters: scenario('navigable'),
  render: () => (
    <Viewport>
      <Text>
        Assigned to{' '}
        <HoverCard defaultOpen navigable portal={false}>
          <HoverCardTrigger href="/people/ana.souza">@ana.souza</HoverCardTrigger>
          <HoverCardContent>
            <PopoverHeader>
              <PopoverTitle>Ana Souza</PopoverTitle>
              <PopoverDescription>@ana.souza · Product, Billing</PopoverDescription>
            </PopoverHeader>
            <PopoverBody>{ANA.bio}</PopoverBody>
            <PopoverFooter>
              <Button size="sm" variant="outline">
                Message
              </Button>
              <Button size="sm">Follow</Button>
            </PopoverFooter>
          </HoverCardContent>
        </HoverCard>{' '}
        for review — Tab from the mention to reach Follow.
      </Text>
    </Viewport>
  ),
};

export const Delay: Story = {
  parameters: scenario('delay'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene label="600 / 300" note="The defaults: a pointer crossing the line opens nothing.">
        <Viewport>
          <Text>
            Reviewed by <Mention person={ANA} />.
          </Text>
        </Viewport>
      </Scene>
      <Scene label="0 / 1000" note="At once, and it lingers for a second after the pointer leaves.">
        <Viewport>
          <Text>
            Reviewed by{' '}
            <Mention person={PEOPLE['marcus.lee'] as Person} openDelay={0} closeDelay={1000} />.
          </Text>
        </Viewport>
      </Scene>
    </div>
  ),
};

const SharedDemo = () => {
  const [handle, setHandle] = useState<string>('ana.souza');
  const person = PEOPLE[handle] ?? ANA;
  return (
    <Viewport>
      <HoverCard
        onOpenChange={(open, request) => {
          const target = (request.source as Event | undefined)?.currentTarget;
          if (open && target instanceof HTMLElement) {
            setHandle(target.dataset['handle'] ?? 'ana.souza');
          }
        }}
        portal={false}
      >
        <Text>
          Thread:{' '}
          <HoverCardTrigger data-handle="ana.souza" href="/people/ana.souza">
            @ana.souza
          </HoverCardTrigger>{' '}
          asked{' '}
          <HoverCardTrigger data-handle="marcus.lee" href="/people/marcus.lee">
            @marcus.lee
          </HoverCardTrigger>{' '}
          for the copy,{' '}
          <HoverCardTrigger data-handle="priya.natarajan" href="/people/priya.natarajan">
            @priya.natarajan
          </HoverCardTrigger>{' '}
          for the clause, and{' '}
          <HoverCardTrigger
            data-handle="konstantinos.papadimitriou"
            href="/people/konstantinos.papadimitriou"
          >
            @konstantinos.papadimitriou
          </HoverCardTrigger>{' '}
          for the ledger.
        </Text>
        <HoverCardContent>
          <PersonBody person={person} />
        </HoverCardContent>
      </HoverCard>
    </Viewport>
  );
};

export const Shared: Story = {
  parameters: scenario('shared'),
  render: () => <SharedDemo />,
};

export const Touch: Story = {
  parameters: scenario('touch'),
  render: () => (
    <Viewport>
      <Text>
        On a touch screen, tap <Mention person={ANA} defaultOpen /> once to see the card and again
        to open the profile.
      </Text>
    </Viewport>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <HoverCardDefaultsProvider openDelay={400}>
      <Viewport>
        <Text>
          Approved by{' '}
          <HoverCard defaultOpen portal={false}>
            <HoverCardTrigger
              href="/people/ana.souza"
              render={(props) => <Link {...props} variant="neutral" />}
            >
              Ana Souza
            </HoverCardTrigger>
            <HoverCardContent>
              <PopoverHeader>
                <PopoverTitle>Ana Souza</PopoverTitle>
                <PopoverDescription>@ana.souza · Product, Billing</PopoverDescription>
                <PopoverClose />
              </PopoverHeader>
              <PopoverBody>{ANA.bio}</PopoverBody>
            </HoverCardContent>
          </HoverCard>{' '}
          on Monday.
        </Text>
      </Viewport>
    </HoverCardDefaultsProvider>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Viewport>
      <Text>
        Tab onto <Mention person={ANA} /> and the card opens at once; Escape closes it; Tab on
        closes it with blur.
      </Text>
    </Viewport>
  ),
};
