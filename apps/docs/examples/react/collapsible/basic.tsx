import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';

export default function CollapsibleBasic() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleHeader>
        <CollapsibleTrigger>Delivery address</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>
        Northwind Traders, 402 Maple Street, Seattle, WA 98101. The dock entrance is on the east
        side.
      </CollapsiblePanel>
    </Collapsible>
  );
}
