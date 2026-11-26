import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import { PopoverBody } from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function HoverCardPlacement() {
  return (
    <Text>
      Reorder{' '}
      <HoverCard side="top" align="center">
        <HoverCardTrigger href="/products/1001">Chai</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Text size="sm">NW-1001, 39 units on hand.</Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>
      ,{' '}
      <HoverCard>
        <HoverCardTrigger href="/products/1002">Chang</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Text size="sm">NW-1002, 17 units on hand.</Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>{' '}
      and{' '}
      <HoverCard side="inline-end" align="center">
        <HoverCardTrigger href="/products/1003">Aniseed Syrup</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Text size="sm">NW-1003, 13 units on hand.</Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>{' '}
      before Friday.
    </Text>
  );
}
