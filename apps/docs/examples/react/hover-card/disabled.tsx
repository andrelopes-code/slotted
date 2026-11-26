import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import { PopoverBody } from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function HoverCardDisabled() {
  return (
    <Text>
      Territory handoff from{' '}
      <HoverCard>
        <HoverCardTrigger href="/people/nancy.davolio">@nancy.davolio</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Text size="sm">Nancy Davolio, Sales Representative, Seattle.</Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>{' '}
      to{' '}
      <HoverCard disabled>
        <HoverCardTrigger href="/people/robert.king">@robert.king</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Text size="sm">Robert King, Sales Representative, London.</Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>
      , whose profile is archived.
    </Text>
  );
}
