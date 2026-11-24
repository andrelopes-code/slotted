import { Tree } from '@slotted/react/tree';

interface AccountRow {
  code: string;
  name: string;
  level: number;
}

const CHART: AccountRow[] = [
  { code: '1000', name: 'Assets', level: 0 },
  { code: '1100', name: 'Cash and equivalents', level: 1 },
  { code: '1110', name: 'Operating account', level: 2 },
  { code: '1120', name: 'Payroll account', level: 2 },
  { code: '1200', name: 'Receivables', level: 1 },
  { code: '2000', name: 'Liabilities', level: 0 },
  { code: '2100', name: 'Payables', level: 1 },
];

export default function TreeFlatRows() {
  return (
    <Tree
      aria-label="Chart of accounts"
      defaultExpandedKeys={['1000', '1100']}
      nodes={CHART}
      getKey={(row) => row.code}
      getLabel={(row) => row.name}
      getLevel={(row) => row.level}
      renderCells={(row) => ({ meta: row.code })}
    />
  );
}
