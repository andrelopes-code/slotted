import type { ReactNode } from 'react';

export function WorkbenchMatrix({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly { label: string; cells: readonly ReactNode[] }[];
}) {
  return (
    <div aria-label="Component comparison" className="slotted-matrix-scroll" role="region">
      <div className="slotted-matrix" style={{ '--slotted-columns': columns.length } as never}>
        <div aria-hidden="true" className="slotted-matrix__corner" />
        {columns.map((column) => <div className="slotted-matrix__heading" key={column}>{column}</div>)}
        {rows.flatMap((row) => [
          <div className="slotted-matrix__row-label" key={`${row.label}-label`}>{row.label}</div>,
          ...row.cells.map((cell, index) => (
            <div className="slotted-matrix__cell" key={`${row.label}-${columns[index]}`}>{cell}</div>
          )),
        ])}
      </div>
    </div>
  );
}
