import { Button } from '@slotted/react/button';
import {
  Collapsible,
  CollapsibleActions,
  CollapsibleHeader,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@slotted/react/collapsible';
import { Toolbar } from '@slotted/react/toolbar';

export default function CollapsibleActionsExample() {
  return (
    <Collapsible defaultOpen variant="framed">
      <CollapsibleHeader>
        <CollapsibleTrigger>Free shipping rule</CollapsibleTrigger>
      </CollapsibleHeader>
      <CollapsibleActions>
        <Toolbar aria-label="Free shipping rule actions" size="sm">
          <Button size="sm" variant="ghost">
            Edit
          </Button>
          <Button size="sm" variant="ghost">
            Duplicate
          </Button>
        </Toolbar>
      </CollapsibleActions>
      <CollapsiblePanel>
        Free shipping over $250.00 on orders to the contiguous states.
      </CollapsiblePanel>
    </Collapsible>
  );
}
