import { Field, FieldLabel } from '@slotted/react/field';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectItem,
  type MultiSelectOption,
} from '@slotted/react/multi-select';

const DOCUMENTS: (MultiSelectOption & { icon: GlyphName; description: string })[] = [
  {
    value: 'invoice',
    label: 'Invoice',
    icon: 'file-text',
    description: 'PDF, issued when the order ships',
  },
  {
    value: 'packing-slip',
    label: 'Packing slip',
    icon: 'file',
    description: 'PDF, one page per parcel',
  },
  {
    value: 'customs',
    label: 'Customs declaration',
    icon: 'file-spreadsheet',
    description: 'CN23, international orders only',
  },
  {
    value: 'photos',
    label: 'Product photos',
    icon: 'file-image',
    description: 'Up to five images per line item',
  },
];

export default function MultiSelectDescriptions() {
  return (
    <Field>
      <FieldLabel>Attach to the shipping email</FieldLabel>
      <MultiSelect defaultValue={['invoice']} items={DOCUMENTS}>
        <MultiSelectControl placeholder="Add a document" />
        <MultiSelectContent>
          {DOCUMENTS.map((document) => (
            <MultiSelectItem
              key={document.value}
              value={document.value}
              description={document.description}
              icon={
                <Icon>
                  <Glyph name={document.icon} />
                </Icon>
              }
            >
              {document.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
    </Field>
  );
}
