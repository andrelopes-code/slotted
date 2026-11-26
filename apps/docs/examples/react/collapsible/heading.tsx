import {
  Collapsible,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Stack } from '@slotted/react/stack';

export default function CollapsibleHeading() {
  return (
    <Collapsible defaultOpen level="2" region variant="framed">
      <CollapsibleHeader>
        <CollapsibleTrigger>Return policy</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsiblePanel>
        <Stack gap={2}>
          <Collapsible defaultOpen level="3" variant="ruled">
            <CollapsibleHeader>
              <CollapsibleTrigger>Domestic orders</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>Thirty calendar days from delivery.</CollapsiblePanel>
          </Collapsible>

          <Collapsible level="3" variant="ruled">
            <CollapsibleHeader>
              <CollapsibleTrigger>International orders</CollapsibleTrigger>
            </CollapsibleHeader>
            <CollapsiblePanel>Sixty days. The buyer pays return freight.</CollapsiblePanel>
          </Collapsible>
        </Stack>
      </CollapsiblePanel>
    </Collapsible>
  );
}
