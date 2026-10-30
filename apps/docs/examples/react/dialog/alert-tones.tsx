import { Button } from '@slotted/react/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogIcon,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogTone,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Inline } from '@slotted/react/inline';

const CONFIRMATIONS: {
  tone: DialogTone;
  trigger: string;
  title: string;
  description: string;
  action: string;
}[] = [
  {
    tone: 'accent',
    trigger: 'Send invoices',
    title: 'Send 214 invoices?',
    description: 'Each customer receives the September invoice by email within the hour.',
    action: 'Send invoices',
  },
  {
    tone: 'warning',
    trigger: 'Publish prices',
    title: 'Publish the new prices?',
    description: 'Open quotes keep their prices; new orders use the new ones from now on.',
    action: 'Publish prices',
  },
  {
    tone: 'success',
    trigger: 'Close September',
    title: 'Close the books for September?',
    description: 'All 1,180 entries reconcile. Entries dated September can no longer be edited.',
    action: 'Close September',
  },
];

export default function DialogAlertTones() {
  return (
    <Inline gap={2}>
      {CONFIRMATIONS.map((confirmation) => (
        <AlertDialog key={confirmation.tone} tone={confirmation.tone}>
          <DialogTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {confirmation.trigger}
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <AlertDialogIcon />
              <DialogTitle>{confirmation.title}</DialogTitle>
              <DialogDescription>{confirmation.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <AlertDialogCancel
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Not now
                  </Button>
                )}
              />
              <AlertDialogAction
                render={(props) => (
                  <Button {...props} tone={confirmation.tone}>
                    {confirmation.action}
                  </Button>
                )}
              />
            </DialogFooter>
          </DialogContent>
        </AlertDialog>
      ))}
    </Inline>
  );
}
