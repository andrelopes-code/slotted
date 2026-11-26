import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleSizes() {
  return (
    <Stack gap={4}>
      <Collapsible defaultOpen size="sm" variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger description="3 of 12 items">Inbound shipments</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Next arrival: pallet PL-4410 at 14:20.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen size="md" variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger description="8 of 20 items">Outbound shipments</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Next pickup: UPS Ground at 16:30.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen size="lg" variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger description="5 of 9 zones">Cycle counts</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Zone C closes at 17:00.</CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
