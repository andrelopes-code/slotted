import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { SkeletonText } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleStates() {
  return (
    <Stack gap={4}>
      <Collapsible defaultOpen disabled variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger description="Read only">Archived carriers</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Contracts with these carriers closed on December 31.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen loading variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger>Delivery history</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>
          <SkeletonText lines={3} />
        </CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
