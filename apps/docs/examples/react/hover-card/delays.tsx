import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import { PopoverBody } from '@slotted/react/popover';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function HoverCardDelays() {
  return (
    <Stack gap={4}>
      <Text>
        Default delays, 600 ms to open and 300 ms to close:{' '}
        <HoverCard>
          <HoverCardTrigger href="/orders/10248">Order 10248</HoverCardTrigger>
          <HoverCardContent>
            <PopoverBody>
              <Text size="sm">Vins et alcools Chevalier, $440.00, shipped Jul 16.</Text>
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>
      </Text>
      <Text>
        Immediate open, closes after 1 second:{' '}
        <HoverCard openDelay={0} closeDelay={1000}>
          <HoverCardTrigger href="/orders/10249">Order 10249</HoverCardTrigger>
          <HoverCardContent>
            <PopoverBody>
              <Text size="sm">Toms Spezialitäten, $1,863.40, shipped Jul 10.</Text>
            </PopoverBody>
          </HoverCardContent>
        </HoverCard>
      </Text>
    </Stack>
  );
}
