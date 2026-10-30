import { useRef, useState } from 'react';
import { Button } from '@slotted/react/button';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldError, FieldLabel } from '@slotted/react/field';
import { Stack } from '@slotted/react/stack';

const CARRIERS = ['UPS', 'FedEx', 'DHL', 'USPS', 'OnTrac', 'LaserShip'];

/** Stands in for a rate service that fails its first request and answers after. */
let outage = true;
function searchCarriers(query: string): Promise<string[]> {
  const needle = query.trim().toLowerCase();
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (outage) {
        outage = false;
        reject(new Error('The rate service did not answer.'));
        return;
      }
      resolve(CARRIERS.filter((carrier) => carrier.toLowerCase().includes(needle)));
    }, 500),
  );
}

export default function ComboboxSearchError() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);

  const search = (text: string) => {
    const request = ++latest.current;
    setLoading(true);
    setFailed(false);
    searchCarriers(text).then(
      (found) => {
        if (request !== latest.current) return;
        setResults(found);
        setLoading(false);
      },
      () => {
        if (request !== latest.current) return;
        setResults([]);
        setFailed(true);
        setLoading(false);
      },
    );
  };

  const type = (text: string) => {
    setQuery(text);
    if (text.trim() !== '') search(text);
  };

  return (
    <Stack gap={3}>
      <Field invalid={failed}>
        <FieldLabel>Carrier</FieldLabel>
        <Combobox
          filter={null}
          inputValue={query}
          onInputValueChange={type}
          loading={loading}
          messages={{ empty: failed ? 'Rates are unavailable.' : 'No carrier by that name.' }}
        >
          <ComboboxInput placeholder="Search carriers" />
          <ComboboxContent>
            {results.map((carrier) => (
              <ComboboxItem key={carrier} value={carrier}>
                {carrier}
              </ComboboxItem>
            ))}
          </ComboboxContent>
        </Combobox>
        {failed && <FieldError>The rate service did not answer. Your text is kept.</FieldError>}
      </Field>
      {failed && (
        <div>
          <Button size="sm" variant="outline" onClick={() => search(query)}>
            Retry
          </Button>
        </div>
      )}
    </Stack>
  );
}
