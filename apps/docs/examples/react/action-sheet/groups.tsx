import {
  ActionSheet,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetGroup,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetSeparator,
  ActionSheetTitle,
  ActionSheetTrigger,
} from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';

export default function ActionSheetGroups() {
  return (
    <ActionSheet>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Shipment
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Shipment SH-4471</ActionSheetTitle>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetGroup label="Notify">
            <ActionSheetItem value="email-carrier">Email the carrier</ActionSheetItem>
            <ActionSheetItem value="text-consignee">Text the consignee</ActionSheetItem>
          </ActionSheetGroup>
          <ActionSheetSeparator />
          <ActionSheetGroup label="Documents">
            <ActionSheetItem value="bill-of-lading">Download bill of lading</ActionSheetItem>
            <ActionSheetItem value="packing-slip">Print packing slip</ActionSheetItem>
          </ActionSheetGroup>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
