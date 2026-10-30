import { Avatar } from '@slotted/react/avatar';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

const PEOPLE = [
  { id: 'avery', name: 'Avery Collins', role: 'Fulfilment lead', away: false },
  { id: 'kenji', name: 'Kenji Watanabe', role: 'Customer care', away: false },
  { id: 'lucia', name: 'Lucía Fernández', role: 'Account manager', away: false },
  { id: 'ruth', name: 'Ruth Adeyemi', role: 'On leave until 14 October', away: true },
  { id: 'tomasz', name: 'Tomasz Nowak', role: 'Warehouse supervisor, Reno', away: false },
  { id: 'omar', name: 'Omar Haddad', role: 'Finance', away: false },
];

export default function ComboboxAssigneePicker() {
  return (
    <Field>
      <FieldLabel>Assignee</FieldLabel>
      <Combobox autoHighlight>
        <ComboboxInput placeholder="Assign to…" />
        <ComboboxContent>
          {PEOPLE.map((person) => (
            <ComboboxItem
              key={person.id}
              value={person.id}
              description={person.role}
              disabled={person.away}
              icon={<Avatar name={person.name} size="xs" decorative />}
            >
              {person.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
