import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@slotted/react/dialog';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const CARRIERS = [
  { value: 'ups', label: 'UPS Ground' },
  { value: 'fedex', label: 'FedEx Ground' },
  { value: 'usps', label: 'USPS Priority Mail' },
];

const labelOf = (value: string) => CARRIERS.find((carrier) => carrier.value === value)?.label;

export default function DialogNested() {
  const [carrier, setCarrier] = useState('ups');
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState(carrier);

  return (
    <Dialog>
      <DialogTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Open order SO-1182
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order SO-1182</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <DialogBody>
          <DescriptionList>
            <DescriptionListItem>
              <DescriptionListTerm>Customer</DescriptionListTerm>
              <DescriptionListDescription>Contoso Foods</DescriptionListDescription>
            </DescriptionListItem>
            <DescriptionListItem>
              <DescriptionListTerm>Carrier</DescriptionListTerm>
              <DescriptionListDescription>{labelOf(carrier)}</DescriptionListDescription>
            </DescriptionListItem>
          </DescriptionList>
        </DialogBody>
        <DialogFooter>
          <Dialog
            open={changing}
            onOpenChange={(next) => {
              if (next) setDraft(carrier);
              setChanging(next);
            }}
            size="sm"
          >
            <DialogTrigger
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Change carrier
                </Button>
              )}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change carrier</DialogTitle>
                <DialogClose />
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel>Carrier</FieldLabel>
                  <Select
                    items={CARRIERS}
                    value={draft}
                    onValueChange={(next) => {
                      if (typeof next === 'string') setDraft(next);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARRIERS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </DialogBody>
              <DialogFooter>
                <Button variant="ghost" tone="secondary" onClick={() => setChanging(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setCarrier(draft);
                    setChanging(false);
                  }}
                >
                  Use carrier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
