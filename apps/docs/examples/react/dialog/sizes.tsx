import { Button } from '@slotted/react/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  type DialogSize,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

const SIZES: { size: DialogSize; title: string; body: string }[] = [
  {
    size: 'sm',
    title: 'Rename warehouse',
    body: 'Small, 24rem: one field or one question.',
  },
  {
    size: 'md',
    title: 'Edit customer',
    body: 'Medium, 32rem, the default: a short form of one column.',
  },
  {
    size: 'lg',
    title: 'Invoice INV-2041',
    body: 'Large, 42rem: a record with a table of line items.',
  },
  {
    size: 'xl',
    title: 'Compare price lists',
    body: 'Extra large, 56rem: two columns side by side.',
  },
  {
    size: 'full',
    title: 'Shipment manifest',
    body: 'Full: the whole layer less its padding, for a document.',
  },
];

export default function DialogSizes() {
  return (
    <Inline gap={2}>
      {SIZES.map((option) => (
        <Dialog key={option.size} size={option.size}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {option.size}
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{option.title}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <DialogBody>
              <Text size="sm">{option.body}</Text>
            </DialogBody>
          </DialogContent>
        </Dialog>
      ))}
    </Inline>
  );
}
