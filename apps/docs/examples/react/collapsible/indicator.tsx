import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleIndicator() {
  return (
    <Stack gap={4}>
      <Collapsible defaultOpen indicator="chevron" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Carrier contracts</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Three active contracts renew on January 1.</CollapsiblePanel>
      </Collapsible>

      <Collapsible indicator="chevron" togglePlacement="start" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Customs documents</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Commercial invoice and packing list.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen indicator="plus-minus" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Supplier invoices</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Seven invoices are due this week.</CollapsiblePanel>
      </Collapsible>

      <Collapsible indicator="plus-minus" togglePlacement="start" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Purchase orders</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Twelve orders await approval.</CollapsiblePanel>
      </Collapsible>

      <Collapsible defaultOpen indicator="none" variant="ruled">
        <CollapsibleHeader>
          <CollapsibleTrigger>Dock schedule</CollapsibleTrigger>
        </CollapsibleHeader>
        <CollapsiblePanel>Door 4 is reserved from 08:00 to 10:00.</CollapsiblePanel>
      </Collapsible>
    </Stack>
  );
}
