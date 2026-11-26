import { useState } from 'react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import type { HoverCardChangeRequest } from '@slotted/react/hover-card';
import {
  PopoverBody,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

interface Person {
  handle: string;
  name: string;
  role: string;
}

const nancy: Person = {
  handle: 'nancy.davolio',
  name: 'Nancy Davolio',
  role: 'Sales Representative, Seattle',
};
const andrew: Person = {
  handle: 'andrew.fuller',
  name: 'Andrew Fuller',
  role: 'Vice President, Sales',
};
const janet: Person = {
  handle: 'janet.leverling',
  name: 'Janet Leverling',
  role: 'Sales Representative, Kirkland',
};
const people = [nancy, andrew, janet];

export default function HoverCardShared() {
  const [person, setPerson] = useState(nancy);

  function handleOpenChange(open: boolean, request: HoverCardChangeRequest) {
    const target = request.source instanceof Event ? request.source.target : null;
    const trigger = target instanceof Element ? target.closest<HTMLElement>('[data-handle]') : null;
    if (!open || trigger === null) return;

    const next = people.find((candidate) => candidate.handle === trigger.dataset['handle']);
    if (next !== undefined) setPerson(next);
  }

  return (
    <HoverCard onOpenChange={handleOpenChange}>
      <Text>
        The pricing table was drafted by{' '}
        <HoverCardTrigger data-handle={nancy.handle} href="/people/nancy.davolio">
          @nancy.davolio
        </HoverCardTrigger>
        , approved by{' '}
        <HoverCardTrigger data-handle={andrew.handle} href="/people/andrew.fuller">
          @andrew.fuller
        </HoverCardTrigger>{' '}
        and handed to{' '}
        <HoverCardTrigger data-handle={janet.handle} href="/people/janet.leverling">
          @janet.leverling
        </HoverCardTrigger>{' '}
        for the carrier terms.
      </Text>
      <HoverCardContent>
        <PopoverHeader>
          <PopoverTitle>{person.name}</PopoverTitle>
          <PopoverDescription>{person.role}</PopoverDescription>
        </PopoverHeader>
        <PopoverBody>
          <Text size="sm">@{person.handle}</Text>
        </PopoverBody>
      </HoverCardContent>
    </HoverCard>
  );
}
