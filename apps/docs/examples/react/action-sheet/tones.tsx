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

export default function ActionSheetTones() {
  return (
    <ActionSheet>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Purchase order
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Purchase order PO-7731</ActionSheetTitle>
          <ActionSheetMessage>Northwind Traders, 18 lines, due 14 October.</ActionSheetMessage>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem icon={<Glyph name="trash" />} tone="danger" value="void">
            Void purchase order
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="pause" />} tone="warning" value="hold">
            Put payments on hold
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="circle-check" />} tone="success" value="approve">
            Approve for purchasing
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="person" />} tone="accent" value="reassign">
            Reassign buyer
          </ActionSheetItem>
          <ActionSheetItem icon={<Glyph name="file-archive" />} tone="secondary" value="archive">
            Archive order
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
