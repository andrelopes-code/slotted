import { Button } from '@slotted/react/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import {
  PopoverBody,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function HoverCardNavigable() {
  return (
    <Text>
      The credit limit for Around the Horn is waiting on{' '}
      <HoverCard navigable>
        <HoverCardTrigger href="/people/andrew.fuller">@andrew.fuller</HoverCardTrigger>
        <HoverCardContent>
          <PopoverHeader>
            <PopoverTitle>Andrew Fuller</PopoverTitle>
            <PopoverDescription>Vice President, Sales</PopoverDescription>
          </PopoverHeader>
          <PopoverBody>
            <Text size="sm">Approves credit limits above $25,000.</Text>
          </PopoverBody>
          <PopoverFooter>
            <Button size="sm">Send message</Button>
          </PopoverFooter>
        </HoverCardContent>
      </HoverCard>
      .
    </Text>
  );
}
