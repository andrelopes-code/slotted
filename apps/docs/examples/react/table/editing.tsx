import { useState } from 'react';
import { NumberField } from '@slotted/react/number-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@slotted/react/select';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableContent,
  TableHead,
  TableRow,
  TableRowHeader,
} from '@slotted/react/table';

const BINS = ['A-04', 'A-07', 'B-12', 'C-01'];

const STOCK = [
  { sku: 'PRD-0412', product: 'Chai', counted: 390, bin: 'A-04' },
  { sku: 'PRD-0413', product: 'Chang', counted: 170, bin: 'A-04' },
  { sku: 'PRD-0414', product: 'Aniseed Syrup', counted: 130, bin: 'B-12' },
  { sku: 'PRD-0415', product: "Chef Anton's Cajun Seasoning", counted: 53, bin: 'C-01' },
];

type Line = (typeof STOCK)[number];

export default function TableEditing() {
  const [lines, setLines] = useState<readonly Line[]>(STOCK);
  const update = (sku: string, change: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.sku === sku ? { ...line, ...change } : line)),
    );

  return (
    <Table columns={4}>
      <TableContent aria-label="Stock take, Reno">
        <TableHead>
          <TableRow>
            <TableColumnHeader>SKU</TableColumnHeader>
            <TableColumnHeader>Product</TableColumnHeader>
            <TableColumnHeader numeric>Counted</TableColumnHeader>
            <TableColumnHeader>Bin</TableColumnHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.sku} value={line.sku}>
              <TableRowHeader text="nowrap">{line.sku}</TableRowHeader>
              <TableCell>{line.product}</TableCell>
              <TableCell numeric>
                <NumberField
                  aria-label={`Counted for ${line.sku}`}
                  min={0}
                  onValueChange={(value) => update(line.sku, { counted: value ?? 0 })}
                  size="sm"
                  stepper="none"
                  value={line.counted}
                  variant="plain"
                />
              </TableCell>
              <TableCell>
                <Select
                  onValueChange={(value) => update(line.sku, { bin: value as string })}
                  size="sm"
                  value={line.bin}
                  variant="plain"
                >
                  <SelectTrigger aria-label={`Bin of ${line.sku}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BINS.map((bin) => (
                      <SelectItem key={bin} value={bin}>
                        {bin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContent>
    </Table>
  );
}
