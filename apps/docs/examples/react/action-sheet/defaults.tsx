import {
  ActionSheet,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetDefaultsProvider,
  ActionSheetHeader,
  ActionSheetItem,
  ActionSheetList,
  ActionSheetTitle,
  ActionSheetTrigger,
} from '@slotted/react/action-sheet';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';

export default function ActionSheetDefaults() {
  return (
    <ActionSheetDefaultsProvider closeOnSelect={false} outsidePress="none">
      <Inline gap={3}>
        <ActionSheet>
          <ActionSheetTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Picking
              </Button>
            )}
          />
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>Picking wave 22</ActionSheetTitle>
            </ActionSheetHeader>
            <ActionSheetList>
              <ActionSheetItem value="start">Start picking</ActionSheetItem>
              <ActionSheetItem value="pause">Pause the wave</ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel />
          </ActionSheetContent>
        </ActionSheet>
        <ActionSheet closeOnSelect>
          <ActionSheetTrigger
            render={(props) => (
              <Button {...props} variant="outline">
                Packing
              </Button>
            )}
          />
          <ActionSheetContent>
            <ActionSheetHeader>
              <ActionSheetTitle>Packing bench 6</ActionSheetTitle>
            </ActionSheetHeader>
            <ActionSheetList>
              <ActionSheetItem value="print">Print labels</ActionSheetItem>
              <ActionSheetItem value="close">Close the bench</ActionSheetItem>
            </ActionSheetList>
            <ActionSheetCancel />
          </ActionSheetContent>
        </ActionSheet>
      </Inline>
    </ActionSheetDefaultsProvider>
  );
}
