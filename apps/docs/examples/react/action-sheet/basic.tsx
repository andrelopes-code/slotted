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
import { Glyph } from '@slotted/react/icon';

export default function ActionSheetBasic() {
  return (
    <ActionSheet>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Order actions
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Order SO-20418</ActionSheetTitle>
          <ActionSheetMessage>Harbor Freight Supply, 12 lines, $4,820.00.</ActionSheetMessage>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem icon={<Glyph name="copy" />} value="copy">
            Copy order link
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="download" />} value="invoice">
            Download invoice
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="pencil" />} value="edit">
            Edit order
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
