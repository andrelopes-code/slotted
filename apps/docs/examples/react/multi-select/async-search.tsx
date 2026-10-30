import { useEffect, useState } from 'react';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
} from '@slotted/react/multi-select';

interface Customer {
  value: string;
  label: string;
  city: string;
}

const CUSTOMERS: Customer[] = [
  { value: 'ALFKI', label: 'Alfreds Futterkiste', city: 'Berlin' },
  { value: 'ANATR', label: 'Ana Trujillo Emparedados', city: 'México D.F.' },
  { value: 'BERGS', label: 'Berglunds snabbköp', city: 'Luleå' },
  { value: 'BLAUS', label: 'Blauer See Delikatessen', city: 'Mannheim' },
  { value: 'BONAP', label: 'Bon app’', city: 'Marseille' },
  { value: 'BOTTM', label: 'Bottom-Dollar Markets', city: 'Tsawassen' },
  { value: 'ERNSH', label: 'Ernst Handel', city: 'Graz' },
  { value: 'FOLKO', label: 'Folk och fä HB', city: 'Bräcke' },
  { value: 'FRANK', label: 'Frankenversand', city: 'München' },
  { value: 'QUICK', label: 'QUICK-Stop', city: 'Cunewalde' },
  { value: 'RATTC', label: 'Rattlesnake Canyon Grocery', city: 'Albuquerque' },
  { value: 'SAVEA', label: 'Save-a-lot Markets', city: 'Boise' },
];

/** Stands in for the customer search endpoint, which filters on the server. */
const searchCustomers = (query: string) =>
  new Promise<Customer[]>((resolve) =>
    setTimeout(() => {
      const needle = query.trim().toLowerCase();
      resolve(CUSTOMERS.filter((customer) => customer.label.toLowerCase().includes(needle)));
    }, 600),
  );

/** The first page of customers, which arrives with the page itself. */
const FIRST_PAGE = CUSTOMERS.slice(0, 6);

export default function MultiSelectAsyncSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>(FIRST_PAGE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults(FIRST_PAGE);
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    void searchCustomers(query).then((found) => {
      if (!current) return;
      setResults(found);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [query]);

  return (
    <Field>
      <FieldLabel>Customers in this campaign</FieldLabel>
      <MultiSelect
        filter={null}
        loading={loading}
        messages={{ empty: 'No customer by that name.', loading: 'Searching customers…' }}
        onInputValueChange={setQuery}
      >
        <MultiSelectControl placeholder="Search customers" />
        <MultiSelectContent>
          {results.map((customer) => (
            <MultiSelectItem
              key={customer.value}
              value={customer.value}
              description={customer.city}
            >
              {customer.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Each keystroke searches the customer list on the server.</FieldDescription>
    </Field>
  );
}
