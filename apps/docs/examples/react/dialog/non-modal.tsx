import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const STEPS = [
  'Pick the 6 lines on the pick list from aisles 4 and 9.',
  'Pack the olive oil upright, with dividers.',
  'Print the UPS label and attach it to the top face.',
];

export default function DialogNonModal() {
  return (
    <Dialog modal={false} outsidePress="none" placement="top" size="sm">
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Show packing steps
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Packing steps</DialogTitle>
          <DialogDescription>
            Order SO-1182. The page stays usable behind this panel.
          </DialogDescription>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <Stack gap={2}>
            {STEPS.map((step, index) => (
              <Text key={step} size="sm">
                {index + 1}. {step}
              </Text>
            ))}
          </Stack>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
