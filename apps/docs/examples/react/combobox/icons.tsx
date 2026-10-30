import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem } from '@slotted/react/combobox';
import { Field, FieldLabel } from '@slotted/react/field';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';

const DOCUMENTS: { id: string; name: string; glyph: GlyphName }[] = [
  { id: 'price-list', name: 'Q4 wholesale price list.xlsx', glyph: 'file-spreadsheet' },
  { id: 'carrier-contract', name: 'Carrier contract 2026.pdf', glyph: 'file-text' },
  { id: 'floor-plan', name: 'Reno floor plan.png', glyph: 'file-image' },
  { id: 'returns-deck', name: 'Returns policy review.key', glyph: 'presentation' },
  { id: 'product-photos', name: 'Autumn product photos.zip', glyph: 'file-archive' },
];

export default function ComboboxIcons() {
  return (
    <Field>
      <FieldLabel>Attach a document</FieldLabel>
      <Combobox>
        <ComboboxInput placeholder="Search shared files" />
        <ComboboxContent>
          {DOCUMENTS.map((document) => (
            <ComboboxItem
              key={document.id}
              value={document.id}
              icon={
                <Icon>
                  <Glyph name={document.glyph} />
                </Icon>
              }
            >
              {document.name}
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
