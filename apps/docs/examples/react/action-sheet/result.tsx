import { useState } from 'react';

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
import type { ActionSheetChangeRequest } from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function ActionSheetResult() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('none');

  function handleOpenChange(next: boolean, request: ActionSheetChangeRequest) {
    setOpen(next);
    setLast(request.result === undefined ? request.reason : `${request.reason}: ${request.result}`);
  }

  return (
    <Inline align="center" gap={3}>
      <ActionSheet open={open} onOpenChange={handleOpenChange}>
        <ActionSheetTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Ticket
            </Button>
          )}
        />
        <ActionSheetContent>
          <ActionSheetHeader>
            <ActionSheetTitle>Support ticket T-3306</ActionSheetTitle>
          </ActionSheetHeader>
          <ActionSheetList>
            <ActionSheetItem value="assign">Assign to me</ActionSheetItem>
            <ActionSheetItem value="escalate">Escalate to billing</ActionSheetItem>
            <ActionSheetItem value="resolve">Mark as resolved</ActionSheetItem>
          </ActionSheetList>
          <ActionSheetCancel />
        </ActionSheetContent>
      </ActionSheet>
      <Text size="sm">Last request: {last}</Text>
    </Inline>
  );
}
