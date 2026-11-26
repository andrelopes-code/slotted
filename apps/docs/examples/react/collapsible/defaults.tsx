import {
  Collapsible,
  CollapsibleDefaultsProvider,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleDefaults() {
  return (
    <CollapsibleDefaultsProvider
      indicator="plus-minus"
      size="sm"
      togglePlacement="start"
      variant="ruled"
    >
      <Stack gap={2}>
        <Collapsible defaultOpen>
          <CollapsibleHeader>
            <CollapsibleTrigger>Receiving dock</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Six pallets are waiting for putaway.</CollapsiblePanel>
        </Collapsible>

        <Collapsible>
          <CollapsibleHeader>
            <CollapsibleTrigger>Cold storage</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Temperature held at 36 degrees F.</CollapsiblePanel>
        </Collapsible>

        <Collapsible indicator="chevron" togglePlacement="end" variant="framed">
          <CollapsibleHeader>
            <CollapsibleTrigger>Returns</CollapsibleTrigger>
          </CollapsibleHeader>
          <CollapsiblePanel>Fourteen units are waiting for inspection.</CollapsiblePanel>
        </Collapsible>
      </Stack>
    </CollapsibleDefaultsProvider>
  );
}
