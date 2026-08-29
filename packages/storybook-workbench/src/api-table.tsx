export interface ApiRow {
  name: string;
  type: string;
  defaultValue: string;
  appliesTo: string;
  description: string;
}

export function ApiTable({ rows }: { rows: readonly ApiRow[] }) {
  return (
    <div aria-label="Component API" className="slotted-api-scroll" role="region" tabIndex={0}>
      <table className="slotted-api-table">
        <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Applies to</th><th scope="col">Notes</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name}><td><code>{row.name}</code></td><td><code>{row.type}</code></td><td><code>{row.defaultValue}</code></td><td>{row.appliesTo}</td><td>{row.description}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
