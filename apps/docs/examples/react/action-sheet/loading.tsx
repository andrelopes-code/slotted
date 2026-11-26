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
import type { ActionSheetSelectEvent } from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';

export default function ActionSheetLoading() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  function handleExport(event: ActionSheetSelectEvent) {
    event.preventDefault();
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setOpen(false);
    }, 2500);
  }

  return (
    <ActionSheet open={open} onOpenChange={setOpen}>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            October invoices
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>October invoices</ActionSheetTitle>
          <ActionSheetMessage>142 invoices, $318,450.00.</ActionSheetMessage>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem
            icon={<Glyph name="file-spreadsheet" />}
            loading={exporting}
            onSelect={handleExport}
            value="export"
          >
            Export as CSV
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="file-text" />} value="summary">
            Print summary
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
