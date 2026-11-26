import { Avatar } from '@slotted/react/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import { Inline } from '@slotted/react/inline';
import { PopoverBody } from '@slotted/react/popover';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function HoverCardBasic() {
  return (
    <Text>
      The pricing table is ready for review. Ask{' '}
      <HoverCard>
        <HoverCardTrigger href="/people/nancy.davolio">@nancy.davolio</HoverCardTrigger>
        <HoverCardContent>
          <PopoverBody>
            <Inline align="center" gap={3}>
              <Avatar name="Nancy Davolio" />
              <Stack gap={1}>
                <Text weight="semibold">Nancy Davolio</Text>
                <Text size="sm" tone="muted">
                  Sales Representative, Seattle
                </Text>
              </Stack>
            </Inline>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>{' '}
      about the carrier rates.
    </Text>
  );
}
