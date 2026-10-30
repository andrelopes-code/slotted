import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const BINS = Array.from({ length: 240 }, (_, index) => {
  const aisle = String(Math.floor(index / 20) + 1).padStart(2, '0');
  const bay = String((index % 20) + 1).padStart(2, '0');
  return { id: `A${aisle}-B${bay}`, detail: `Aisle ${Number(aisle)}, bay ${Number(bay)} · Reno` };
});

export default function ComboboxLongList() {
  return (
    <Field>
      <FieldLabel>Put-away bin</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search 240 bins" />
        <ComboboxContent>
          {BINS.map((bin) => (
            <ComboboxItem key={bin.id} value={bin.id} description={bin.detail}>
              {bin.id}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Page Down and Page Up move ten bins at a time.</FieldDescription>
    </Field>
  );
}
