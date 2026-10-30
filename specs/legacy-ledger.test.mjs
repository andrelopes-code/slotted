import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { LEGACY_FAMILIES, LEGACY_SCHEMA_VERSION, SCHEMA_VERSION } from './contract.schema.mjs';

const components = new URL('./components/', import.meta.url).pathname;

/**
 * The ledger is the ratchet the rebuild runs on. Twenty-nine families were
 * built before the foundation existed; each leaves the list when it is rebuilt
 * against the current schema, and nothing may join it. Without the cap, a
 * family written today could opt out of the law by adding a line.
 */
const CEILING = 29;

function families() {
  return readdirSync(components, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function contractOf(family) {
  return JSON.parse(readFileSync(join(components, family, 'contract.json'), 'utf8'));
}

test('never grows the ledger', () => {
  assert.ok(
    LEGACY_FAMILIES.length <= CEILING,
    `The ledger holds ${LEGACY_FAMILIES.length} families and may never exceed ${CEILING}`,
  );
});

test('lists only families that exist', () => {
  const present = new Set(families());
  for (const family of LEGACY_FAMILIES) {
    assert.ok(present.has(family), `${family} is listed as legacy and has no contract`);
  }
});

test('holds every listed family at the legacy schema', () => {
  for (const family of LEGACY_FAMILIES) {
    assert.equal(
      contractOf(family).schemaVersion,
      LEGACY_SCHEMA_VERSION,
      `${family} satisfies the current schema, so remove it from the ledger`,
    );
  }
});

test('holds every unlisted family at the current schema', () => {
  const legacy = new Set(LEGACY_FAMILIES);
  for (const family of families()) {
    if (legacy.has(family)) continue;
    assert.equal(
      contractOf(family).schemaVersion,
      SCHEMA_VERSION,
      `${family} is not listed as legacy and must satisfy schema ${SCHEMA_VERSION}`,
    );
  }
});
