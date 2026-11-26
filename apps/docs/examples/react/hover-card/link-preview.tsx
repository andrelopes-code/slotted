import { HoverCard, HoverCardContent, HoverCardTrigger } from '@slotted/react/hover-card';
import {
  PopoverBody,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@slotted/react/popover';
import { Text } from '@slotted/react/typography';

export default function HoverCardLinkPreview() {
  return (
    <Text>
      Freight for October follows the{' '}
      <HoverCard>
        <HoverCardTrigger href="/documents/q4-carrier-rate-card">
          Q4 carrier rate card
        </HoverCardTrigger>
        <HoverCardContent>
          <PopoverHeader>
            <PopoverTitle>Q4 carrier rate card</PopoverTitle>
            <PopoverDescription>Spreadsheet, updated 2 hours ago</PopoverDescription>
          </PopoverHeader>
          <PopoverBody>
            <Text size="sm">
              Freight rates by carrier and zone for October through December, with the fuel
              surcharge from Oct 1.
            </Text>
          </PopoverBody>
        </HoverCardContent>
      </HoverCard>
      , which Federal Shipping has already signed.
    </Text>
  );
}
