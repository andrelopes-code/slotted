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

export default function ActionSheetPolicy() {
  return (
    <ActionSheet back="none" escape="none" outsidePress="none">
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Adjust stock
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Inventory adjustment</ActionSheetTitle>
          <ActionSheetMessage>SKU 40-1182 in Reno: 140 on hand, 132 counted.</ActionSheetMessage>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem value="apply">Apply adjustment of -8</ActionSheetItem>
          <ActionSheetItem value="recount">Request a recount</ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
