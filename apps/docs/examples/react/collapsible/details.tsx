import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleDetails() {
  return (
    <Stack gap={2}>
      <Collapsible variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger description="14 orders, $182,400.00">
            Open purchase orders
          </CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>PO-2201 to PO-2214, all due before March 15.</CollapsiblePanel>
      </Collapsible>

      <Collapsible variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger summary="4 scheduled">Carrier pickups</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>UPS 16:30, FedEx 17:00, USPS 18:00, DHL 18:30.</CollapsiblePanel>
      </Collapsible>

      <Collapsible truncate variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger summary="Updated Mar 4">
            Return conditions for international orders shipped from the Reno warehouse
          </CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Sixty days. The buyer pays return freight.</CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
