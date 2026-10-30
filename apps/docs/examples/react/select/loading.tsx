import { useState } from 'react';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const SLOTS: SelectOption[] = [
  { value: 'thu-am', label: 'Thursday, 8:00–12:00' },
  { value: 'thu-pm', label: 'Thursday, 13:00–17:00' },
  { value: 'fri-am', label: 'Friday, 8:00–12:00' },
];

/** Stands in for a request to the carrier's pickup API. */
const fetchSlots = () =>
  new Promise<SelectOption[]>((resolve) => setTimeout(() => resolve(SLOTS), 1500));

export default function SelectLoading() {
  const [slots, setSlots] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async (open: boolean) => {
    if (!open || loaded || loading) return;
    setLoading(true);
    setSlots(await fetchSlots());
    setLoading(false);
    setLoaded(true);
  };

  return (
    <Field>
      <FieldLabel>Pickup slot</FieldLabel>
      <Select
        loading={loading}
        items={slots}
        messages={{ loading: 'Fetching pickup slots…' }}
        onOpenChange={(open) => void load(open)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a slot" />
        </SelectTrigger>
        <SelectContent>
          {slots.map((slot) => (
            <SelectItem key={slot.value} value={slot.value}>
              {slot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Slots load from the carrier when the list opens.</FieldDescription>
    </Field>
  );
}
