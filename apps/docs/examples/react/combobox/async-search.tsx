import { useEffect, useState } from 'react';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';

interface Customer {
  id: string;
  name: string;
  city: string;
}

const DIRECTORY: Customer[] = [
  { id: 'brightline', name: 'Brightline Studio', city: 'Portland, OR' },
  { id: 'harbor-pine', name: 'Harbor & Pine', city: 'Seattle, WA' },
  { id: 'northgate', name: 'Northgate Labs', city: 'Austin, TX' },
  { id: 'quill', name: 'Quill & Co.', city: 'Brooklyn, NY' },
  { id: 'solstice', name: 'Solstice Outdoor', city: 'Boulder, CO' },
  { id: 'verde', name: 'Verde Kitchen', city: 'Oakland, CA' },
  { id: 'atlas', name: 'Atlas Freight', city: 'Memphis, TN' },
  { id: 'juniper', name: 'Juniper Health', city: 'Minneapolis, MN' },
  { id: 'kestrel', name: 'Kestrel Robotics', city: 'Pittsburgh, PA' },
  { id: 'larkspur', name: 'Larkspur Books', city: 'Asheville, NC' },
  { id: 'meridian', name: 'Meridian Hotels', city: 'Chicago, IL' },
  { id: 'oakline', name: 'Oakline Furniture', city: 'Grand Rapids, MI' },
  { id: 'pelican', name: 'Pelican Coffee', city: 'Tampa, FL' },
  { id: 'saltmarsh', name: 'Saltmarsh Dairy', city: 'Burlington, VT' },
  { id: 'tidewater', name: 'Tidewater Supply', city: 'Norfolk, VA' },
];

/** Stands in for a request to the server, which answers after 600 ms. */
function searchCustomers(query: string): Promise<Customer[]> {
  const needle = query.trim().toLowerCase();
  const found = DIRECTORY.filter((customer) => customer.name.toLowerCase().includes(needle));
  return new Promise((resolve) => setTimeout(() => resolve(found), 600));
}

export default function ComboboxAsyncSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    const debounce = setTimeout(() => {
      void searchCustomers(query).then((found) => {
        if (!current) return;
        setResults(found);
        setLoading(false);
      });
    }, 250);
    return () => {
      current = false;
      clearTimeout(debounce);
    };
  }, [query]);

  return (
    <Field>
      <FieldLabel>Customer</FieldLabel>
      <Combobox
        filter={null}
        inputValue={query}
        onInputValueChange={setQuery}
        loading={loading}
        messages={{
          empty: query.trim() === '' ? 'Type a name to search.' : 'No customer by that name.',
        }}
      >
        <ComboboxInput placeholder="Search 15 customers" />
        <ComboboxContent>
          {results.map((customer) => (
            <ComboboxItem key={customer.id} value={customer.id} description={customer.city}>
              {customer.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
