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
import { Glyph } from '@slotted/react/icon';

export default function ActionSheetStates() {
  return (
    <ActionSheet>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Invoice
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Invoice INV-9302</ActionSheetTitle>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem
            description="Needs a second approver above $5,000."
            icon={<Glyph name="circle-check" />}
            value="approve"
          >
            Approve invoice
          </ActionSheetItem>
          <ActionSheetItem
            description="Available after approval."
            disabled
            icon={<Glyph name="upload" />}
            value="send"
          >
            Send to accounting
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="download" />} value="pdf">
            Download PDF
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
