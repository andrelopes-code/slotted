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

export default function ActionSheetLinks() {
  return (
    <ActionSheet>
      <ActionSheetTrigger
        render={(props) => (
          <Button {...props} variant="outline">
            Open
          </Button>
        )}
      />
      <ActionSheetContent>
        <ActionSheetHeader>
          <ActionSheetTitle>Order SO-10482</ActionSheetTitle>
        </ActionSheetHeader>
        <ActionSheetList>
          <ActionSheetItem render={(props) => <a {...props} href="#order-SO-10482" />}>
            Order page
          </ActionSheetItem>
          <ActionSheetItem render={(props) => <a {...props} href="#customer-northwind" />}>
            Customer profile
          </ActionSheetItem>
          <ActionSheetItem
            icon={<Glyph name="external" />}
            render={(props) => (
              <a
                {...props}
                href="https://example.com/carriers/track/1Z999AA10123456784"
                rel="noreferrer"
                target="_blank"
              />
            )}
          >
            Carrier tracking
          </ActionSheetItem>
        </ActionSheetList>
        <ActionSheetCancel />
      </ActionSheetContent>
    </ActionSheet>
  );
}
