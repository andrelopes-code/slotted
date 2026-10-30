import { Field, FieldLabel } from '@slotted/react/field';
import { Glyph, type GlyphName, Icon } from '@slotted/react/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectOption,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';

const FORMATS: (SelectOption & { icon: GlyphName; description: string })[] = [
  {
    value: 'csv',
    label: 'CSV',
    icon: 'file-spreadsheet',
    description: 'Opens in Excel and Google Sheets.',
  },
  {
    value: 'pdf',
    label: 'PDF',
    icon: 'file-text',
    description: 'Paginated, with the company letterhead.',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: 'file',
    description: 'For an import into another system.',
  },
];

export default function SelectDescriptions() {
  return (
    <Field>
      <FieldLabel>Export format</FieldLabel>
      <Select defaultValue="csv" items={FORMATS}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FORMATS.map((format) => (
            <SelectItem
              key={format.value}
              value={format.value}
              description={format.description}
              icon={
                <Icon>
                  <Glyph name={format.icon} />
                </Icon>
              }
            >
              {format.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
