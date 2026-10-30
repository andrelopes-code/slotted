import type { ReactNode } from 'react';

export function WorkbenchMatrix({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly { label: string; cells: readonly ReactNode[] }[];
}) {
  for (const row of rows) {
    const hasOneCellPerColumn = row.cells.length === columns.length;
    const hasOnlyRenderableCells = row.cells.every(
      (cell) =>
        cell !== null &&
        cell !== undefined &&
        typeof cell !== 'boolean' &&
        (typeof cell !== 'string' || cell.trim().length > 0),
    );

    if (!hasOneCellPerColumn || !hasOnlyRenderableCells) {
      throw new Error(
        `Matrix row "${row.label}" must provide one non-empty demonstration per column`,
      );
    }
  }

  return (
    <div
      aria-label="Component comparison"
      className="slotted-matrix-scroll"
      role="region"
      tabIndex={0}
    >
      <table className="slotted-matrix">
        <thead>
          <tr>
            <th aria-hidden="true" className="slotted-matrix__corner" />
            <>
              {columns.map((column) => (
                <th className="slotted-matrix__heading" key={column} scope="col">
                  {column}
                </th>
              ))}
            </>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th className="slotted-matrix__row-label" scope="row">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td className="slotted-matrix__cell" key={`${row.label}-${columns[index]}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
