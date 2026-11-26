import {
  HoverCard,
  HoverCardContent,
  HoverCardDefaultsProvider,
  HoverCardTrigger,
} from '@slotted/react/hover-card';
import { PopoverBody } from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function HoverCardDefaults() {
  return (
    <HoverCardDefaultsProvider openDelay={200} closeDelay={200}>
      <Text>
        Escalate to{' '}
        <HoverCard>
          <HoverCardTrigger href="/people/steven.buchanan">@steven.buchanan</HoverCardTrigger>
          <HoverCardContent>
            <PopoverBody>
              <Text size="sm">Steven Buchanan, Sales Manager, London.</Text>
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>{' '}
        or, for returns, to{' '}
        <HoverCard closeDelay={1000}>
          <HoverCardTrigger href="/people/margaret.peacock">@margaret.peacock</HoverCardTrigger>
          <HoverCardContent>
            <PopoverBody>
              <Text size="sm">Margaret Peacock, Sales Representative, Redmond.</Text>
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>
        .
      </Text>
    </HoverCardDefaultsProvider>
  );
}
