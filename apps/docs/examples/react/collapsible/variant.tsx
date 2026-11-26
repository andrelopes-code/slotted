import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleVariant() {
  return (
    <Stack gap={4}>
      <Collapsible defaultOpen variant="plain">
        <CollapsibleHeader>
          <CollapsibleTrigger>Payment terms</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Net 30 from the invoice date.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Shipping terms</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>FOB origin. Freight is billed at cost.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen variant="framed">
        <CollapsibleHeader>
          <CollapsibleTrigger>Return terms</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Thirty calendar days, unopened pallets only.</CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
