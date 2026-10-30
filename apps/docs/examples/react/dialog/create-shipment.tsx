import { useState, type SubmitEvent } from 'react';

import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const CARRIERS = [
  { value: 'ups', label: 'UPS Ground', description: '3–5 business days' },
  { value: 'fedex', label: 'FedEx 2Day', description: '2 business days' },
  { value: 'usps', label: 'USPS Priority Mail', description: '1–3 business days' },
];

function weightError(value: string): string {
  if (value.trim() === '') return 'Enter the total weight of the packages.';
  const weight = Number(value);
  if (!Number.isFinite(weight) || weight <= 0) return 'Enter a weight above 0, such as 18.4.';
  return '';
}

export default function DialogCreateShipment() {
  const [open, setOpen] = useState(false);
  const [carrier, setCarrier] = useState('ups');
  const [weight, setWeight] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const error = submitted ? weightError(weight) : '';

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (weightError(weight) !== '') return;
    setSaving(true);
    setTimeout(() => {
      const label = CARRIERS.find((option) => option.value === carrier)?.label;
      setSaving(false);
      setCreated(`Shipment SH-4472 created with ${label}.`);
      setOpen(false);
    }, 1200);
  };

  return (
    <Inline align="center" gap={3}>
      <Dialog
        open={open}
        onOpenChange={(next, request) => {
          if (!next && saving) return request.cancel();
          if (next) {
            setWeight('');
            setSubmitted(false);
          }
          setOpen(next);
        }}
        size="lg"
      >
        <DialogTrigger render={(props) => <Button {...props}>Create shipment</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a shipment</DialogTitle>
            <DialogDescription>
              Order SO-1182 for Contoso Foods: 6 items to 1200 Pike St, Seattle.
            </DialogDescription>
            <DialogClose />
          </DialogHeader>
          <DialogBody>
            <form id="create-shipment" noValidate onSubmit={submit}>
              <Stack gap={5}>
                <Field>
                  <FieldLabel>Carrier</FieldLabel>
                  <Select
                    items={CARRIERS}
                    name="carrier"
                    value={carrier}
                    onValueChange={(next) => {
                      if (typeof next === 'string') setCarrier(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIERS.map((option) => (
                        <SelectItem
                          key={option.value}
                          description={option.description}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field required invalid={error !== '' ? true : undefined}>
                  <FieldLabel>Weight in kilograms</FieldLabel>
                  <FieldDescription>
                    All packages together, as weighed at the dock.
                  </FieldDescription>
                  <TextField
                    inputMode="decimal"
                    name="weight"
                    value={weight}
                    onValueChange={setWeight}
                  />
                  <FieldError live="polite" reserve>
                    {error}
                  </FieldError>
                </Field>
                <Checkbox defaultChecked name="notify">
                  Email the tracking number to the customer
                </Checkbox>
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button
              disabled={saving}
              variant="ghost"
              tone="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              form="create-shipment"
              loading={saving}
              messages={{ loading: 'Creating shipment' }}
              type="submit"
            >
              Create shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {created === null ? null : (
        <Text role="status" size="sm" tone="muted">
          {created}
        </Text>
      )}
    </Inline>
  );
}
