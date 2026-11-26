import { useState } from 'react';

import {
  ActionSheet,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetMessage,
  ActionSheetSeparator,
  ActionSheetTitle,
  ActionSheetTrigger,
} from '@slotted/react/action-sheet';
import type { ActionSheetSelectEvent } from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function ActionSheetKeepOpen() {
  const [loaded, setLoaded] = useState<string[]>([]);

  function handleToggle(event: ActionSheetSelectEvent) {
    const pallet = event.value ?? '';
    setLoaded((current) =>
      current.includes(pallet) ? current.filter((id) => id !== pallet) : [...current, pallet],
    );
  }

  return (
    <Inline align="center" gap={3}>
      <ActionSheet closeOnSelect={false} messages={{ cancel: 'Done' }}>
        <ActionSheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Load route 14
            </Button>
          )}
        />
        <ActionSheetContent>
          <ActionSheetHeader>
            <ActionSheetTitle>Route 14, Reno to Sacramento</ActionSheetTitle>
            <ActionSheetMessage>
              Press a pallet to add it or take it off the truck.
            </ActionSheetMessage>
          </ActionSheetHeader>
          <ActionSheetList>
            <ActionSheetItem onSelect={handleToggle} value="P-118">
              Pallet P-118, 24 cartons
            </ActionSheetItem>
            <ActionSheetItem onSelect={handleToggle} value="P-119">
              Pallet P-119, 18 cartons
            </ActionSheetItem>
            <ActionSheetItem onSelect={handleToggle} value="P-124">
              Pallet P-124, 30 cartons
            </ActionSheetItem>
            <ActionSheetSeparator />
            <ActionSheetItem closeOnSelect value="dispatch">
              Dispatch route 14
            </ActionSheetItem>
          </ActionSheetList>
          <ActionSheetCancel />
        </ActionSheetContent>
      </ActionSheet>
      <Text size="sm">Loaded: {loaded.length === 0 ? 'none' : loaded.join(', ')}</Text>
    </Inline>
  );
}
