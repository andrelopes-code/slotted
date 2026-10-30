export interface ApiRow {
  name: string;
  type: string;
  defaultValue: string;
  appliesTo: string;
  description: string;
}

/**
 * What the family emits, which no column of `ApiRow` can hold. An input has a
 * default and an event has a payload and a moment; putting both in one table
 * left every family that emits something documenting the payload inside the
 * notes column, or not at all.
 */
export interface EventRow {
  name: string;
  payload: string;
  when: string;
}

/**
 * A part the consumer can write, place or replace. The contract already
 * declares the part names; this is where the page says what each one is for
 * and which element it renders, because a reader who cannot see the anatomy
 * cannot compose the family without reading its source.
 */
export interface AnatomyRow {
  part: string;
  /** The part this one is written inside; absent for the root. */
  parent?: string;
  element: string;
  required: boolean;
  purpose: string;
}

function ScrollableTable({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div aria-label={label} className="slotted-api-scroll" role="region" tabIndex={0}>
      <table className="slotted-api-table">{children}</table>
    </div>
  );
}

export function ApiTable({ rows }: { rows: readonly ApiRow[] }) {
  return (
    <ScrollableTable label="Component API">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">Applies to</th>
          <th scope="col">Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          /**
           * A row is one prop **on one part**, as `apiMetadataErrors` already
           * holds: `select` documents a `value` on its root and one on each
           * option, and `table-of-contents` a `value` on its root and one on
           * each item. Keyed by the name alone, React warned of two children
           * with the same key on every such page and dropped one of the rows.
           */
          <tr key={`${row.appliesTo ?? ''}.${row.name}`}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>
              <code>{row.type}</code>
            </td>
            <td>
              <code>{row.defaultValue}</code>
            </td>
            <td>{row.appliesTo}</td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </ScrollableTable>
  );
}

export function EventTable({ rows }: { rows: readonly EventRow[] }) {
  return (
    <ScrollableTable label="Events">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Payload</th>
          <th scope="col">Emitted when</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>
              <code>{row.payload}</code>
            </td>
            <td>{row.when}</td>
          </tr>
        ))}
      </tbody>
    </ScrollableTable>
  );
}

export function AnatomyTable({ rows }: { rows: readonly AnatomyRow[] }) {
  return (
    <ScrollableTable label="Anatomy">
      <thead>
        <tr>
          <th scope="col">Part</th>
          <th scope="col">Element</th>
          <th scope="col">Required</th>
          <th scope="col">Purpose</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.part}>
            <td>
              <code>data-part="{row.part}"</code>
            </td>
            <td>
              <code>{row.element}</code>
            </td>
            <td>{row.required ? 'Always' : 'Optional'}</td>
            <td>{row.purpose}</td>
          </tr>
        ))}
      </tbody>
    </ScrollableTable>
  );
}
