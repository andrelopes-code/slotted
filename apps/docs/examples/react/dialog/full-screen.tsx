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
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const STOPS = [
  { time: '08:10', place: 'Contoso Foods, 1200 Pike St' },
  { time: '08:55', place: 'Fabrikam Grocers, 410 Broadway E' },
  { time: '09:40', place: 'Tailspin Market, 3300 Fremont Ave N' },
  { time: '10:30', place: 'Woodgrove Deli, 85 Pine St' },
  { time: '11:15', place: 'Wide World Importers, 2201 1st Ave S' },
];

export default function DialogFullScreen() {
  return (
    <Dialog fullscreenToggle size="lg">
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Open route plan
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Route 14, Tuesday 6 October</DialogTitle>
          <DialogDescription>5 stops, 38 km, driver Ana Souza.</DialogDescription>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <Stack gap={3}>
            {STOPS.map((stop) => (
              <Inline key={stop.time} gap={4}>
                <Text size="sm" tone="muted">
                  {stop.time}
                </Text>
                <Text size="sm">{stop.place}</Text>
              </Inline>
            ))}
          </Stack>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
