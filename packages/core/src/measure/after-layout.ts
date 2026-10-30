/**
 * Runs work once the browser has laid the document out, in the same frame and
 * before it paints. A `ResizeObserver` reports after layout, so geometry read
 * there, and a `focus()` made there, lay nothing out; the same work done in the
 * commit that mounted a layer forced the layout early, once per read.
 *
 * Every caller waiting on one document shares one report, and the report runs
 * every `read` before any `write`: a write between two reads would dirty the
 * layout the second read then forces. A `focus()` is a read here — it needs the
 * layout and changes none of it.
 *
 * It observes the document element, which always has a box: an observed
 * element without one may never be reported. A document without
 * `ResizeObserver` — a headless one — runs the read and the write at once. The
 * returned function cancels work that has not run yet.
 */
export function afterLayout(doc: Document, read: () => void, write?: () => void): () => void {
  const Observer = doc.defaultView?.ResizeObserver;
  if (Observer === undefined) {
    read();
    write?.();
    return () => undefined;
  }

  let batch = batches.get(doc);
  if (batch === undefined) {
    const created: Batch = { entries: [] };
    batch = created;
    batches.set(doc, created);
    const observer = new Observer(() => {
      observer.disconnect();
      batches.delete(doc);
      const live = created.entries.filter((entry) => entry.live);
      for (const entry of live) entry.read();
      for (const entry of live) entry.write?.();
    });
    observer.observe(doc.documentElement);
  }

  const entry: Entry = { live: true, read, write };
  batch.entries.push(entry);
  return () => {
    entry.live = false;
  };
}

interface Entry {
  live: boolean;
  read: () => void;
  write: (() => void) | undefined;
}

interface Batch {
  entries: Entry[];
}

/** The report each document is waiting on. */
const batches = new WeakMap<Document, Batch>();
