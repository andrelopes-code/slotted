import { useMemo, useRef, useState } from 'react';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';

const PRODUCTS = [
  'Canvas tote',
  'Merino beanie',
  'Stoneware mug',
  'Linen apron',
  'Trail daypack',
  'Wool throw',
  'Ceramic planter',
  'Field notebook',
  'Rain shell',
  'Leather wallet',
  'Weekender bag',
  'Cotton crewneck',
  'Camp mug',
  'Insulated bottle',
  'Chambray shirt',
  'Waffle towel',
  'Beeswax candle',
  'Rattan basket',
  'Hiking socks',
  'Down vest',
  'Sketchbook',
  'Wool blanket',
  'Market crossbody',
  'Felt slippers',
];
const COLORS = [
  'Natural',
  'Charcoal',
  'Olive',
  'Rust',
  'Navy',
  'Sand',
  'Forest',
  'Slate',
  'Clay',
  'Ink',
];
const SKUS = PRODUCTS.flatMap((product, row) =>
  COLORS.map((color, column) => ({
    sku: `NW-${1001 + row * COLORS.length + column}`,
    label: `${product}, ${color}`,
  })),
);
const PAGE = 30;

export default function ComboboxLoadMore() {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  /* The server's answer: every SKU whose label holds the query, a page at a time. */
  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SKUS.filter((item) => item.label.toLowerCase().includes(needle));
  }, [query]);

  const type = (text: string) => {
    request.current += 1;
    setQuery(text);
    setShown(PAGE);
    setLoading(false);
  };

  const loadMore = () => {
    if (loading || shown >= matching.length) return;
    const current = ++request.current;
    setLoading(true);
    setTimeout(() => {
      if (current !== request.current) return;
      setShown((count) => count + PAGE);
      setLoading(false);
    }, 500);
  };

  return (
    <Field>
      <FieldLabel>Variant</FieldLabel>
      <Combobox
        filter={null}
        inputValue={query}
        onInputValueChange={type}
        loading={loading}
        onLoadMore={loadMore}
        total={matching.length}
      >
        <ComboboxInput placeholder="Search 240 SKUs" />
        <ComboboxContent>
          {matching.slice(0, shown).map((item, index) => (
            <ComboboxItem
              key={item.sku}
              value={item.sku}
              description={item.sku}
              position={index + 1}
            >
              {item.label}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>
        Thirty at a time; scrolling to the end fetches the next page.
      </FieldDescription>
    </Field>
  );
}
