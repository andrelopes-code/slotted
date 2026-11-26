import { useState } from 'react';

import {
  ActionSheet,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetMessage,
  ActionSheetTitle,
  ActionSheetTrigger,
} from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';

export default function ActionSheetModal() {
  const [scanned, setScanned] = useState(0);

  return (
    <Inline align="center" gap={3}>
      <ActionSheet modal={false}>
        <ActionSheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Dock 3 actions
            </Button>
          )}
        />
        <ActionSheetContent>
          <ActionSheetHeader>
            <ActionSheetTitle>Dock 3 receiving</ActionSheetTitle>
            <ActionSheetMessage>Keep scanning while this sheet stays open.</ActionSheetMessage>
          </ActionSheetHeader>
          <ActionSheetList>
            <ActionSheetItem tone="warning" value="damaged">
              Flag damaged parcel
            </ActionSheetItem>
            <ActionSheetItem value="inspection">Hold for inspection</ActionSheetItem>
          </ActionSheetList>
          <ActionSheetCancel />
        </ActionSheetContent>
      </ActionSheet>
      <Button onClick={() => setScanned((count) => count + 1)}>Scan parcel ({scanned})</Button>
    </Inline>
  );
}
