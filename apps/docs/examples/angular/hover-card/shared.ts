import { Component, signal } from '@angular/core';
import { SlHoverCard, SlHoverCardTrigger } from '@slotted/angular/hover-card';
import {
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
} from '@slotted/angular/popover';
import type { PopoverChangeRequest } from '@slotted/angular/popover';
import { SlText } from '@slotted/angular/typography';

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

@Component({
  selector: 'app-hover-card-shared',
  imports: [
    SlHoverCard,
    SlHoverCardTrigger,
    SlPopoverArrow,
    SlPopoverBody,
    SlPopoverContent,
    SlPopoverDescription,
    SlPopoverHeader,
    SlPopoverLayer,
    SlPopoverTitle,
    SlText,
  ],
  template: `
    <ng-container slHoverCard (openChangeRequest)="remember($event)">
      <p slText>
        The pricing table was drafted by
        <a slHoverCardTrigger data-handle="nancy.davolio" href="/people/nancy.davolio"
          >&#64;nancy.davolio</a
        >, approved by
        <a slHoverCardTrigger data-handle="andrew.fuller" href="/people/andrew.fuller"
          >&#64;andrew.fuller</a
        >
        and handed to
        <a slHoverCardTrigger data-handle="janet.leverling" href="/people/janet.leverling"
          >&#64;janet.leverling</a
        >
        for the carrier terms.
      </p>
      <ng-template slPopoverLayer>
        <div slPopoverContent>
          <div slPopoverHeader>
            <div slPopoverTitle>{{ person().name }}</div>
            <p slPopoverDescription>{{ person().role }}</p>
          </div>
          <div slPopoverBody>
            <p slText size="sm">&#64;{{ person().handle }}</p>
          </div>
        </div>
        <div slPopoverArrow></div>
      </ng-template>
    </ng-container>
  `,
})
export class HoverCardShared {
  readonly person = signal<Person>(nancy);

  remember(request: PopoverChangeRequest): void {
    const target = request.source instanceof Event ? request.source.target : null;
    const trigger = target instanceof Element ? target.closest<HTMLElement>('[data-handle]') : null;
    if (!request.value || trigger === null) return;

    const next = people.find((candidate) => candidate.handle === trigger.dataset['handle']);
    if (next !== undefined) this.person.set(next);
  }
}
