import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDefaultsProvider,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function DialogDefaults() {
  return (
    <DialogDefaultsProvider placement="top" size="lg">
      <Inline gap={2}>
        <Dialog>
          <DialogTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Purchase order PO-7730
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase order PO-7730</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Text size="sm">Large and at the top, from the provider.</Text>
            </DialogBody>
          </DialogContent>
        </Dialog>
        <Dialog size="sm">
          <DialogTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Rename supplier
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename supplier</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Text size="sm">At the top from the provider, and small because it says so.</Text>
            </DialogBody>
          </DialogContent>
        </Dialog>
      </Inline>
    </DialogDefaultsProvider>
  );
}
