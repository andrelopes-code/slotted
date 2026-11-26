import { useRef } from 'react';

import {
  ActionSheet,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetTitle,
  ActionSheetTrigger,
} from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';

export default function ActionSheetFocus() {
  const reprint = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  return (
    <Inline align="center" gap={3}>
      <ActionSheet finalFocus={next} initialFocus={reprint}>
        <ActionSheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Label actions
            </Button>
          )}
        />
        <ActionSheetContent>
          <ActionSheetHeader>
            <ActionSheetTitle>Shipment SH-4471</ActionSheetTitle>
          </ActionSheetHeader>
          <ActionSheetList>
            <ActionSheetItem value="slip">Print packing slip</ActionSheetItem>
            <ActionSheetItem ref={reprint} value="reprint">
              Reprint shipping label
            </ActionSheetItem>
            <ActionSheetItem value="void">Void shipping label</ActionSheetItem>
          </ActionSheetList>
          <ActionSheetCancel />
        </ActionSheetContent>
      </ActionSheet>
      <Button ref={next} variant="ghost">
        Scan next parcel
      </Button>
    </Inline>
  );
}
