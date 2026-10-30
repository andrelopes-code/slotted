import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Build-time only: every family with a contract under `specs/components/`.
 * Resolved from the working directory, because a bundled server chunk no
 * longer sits where its source file did.
 */
const specsRoot = resolve(process.cwd(), '../../specs/components');

export function specifiedFamilies(): string[] {
  return readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function familyTitle(family: string): string {
  const title = family.replace(/-/g, ' ');
  return title.charAt(0).toUpperCase() + title.slice(1);
}

export interface FamilyCatalog {
  group: string;
  summary: string;
}

/** The shelf and the one-sentence summary a family's contract declares. */
export function familyCatalog(family: string): FamilyCatalog {
  const contract = JSON.parse(
    readFileSync(resolve(specsRoot, family, 'contract.json'), 'utf8'),
  ) as {
    catalog: FamilyCatalog;
  };
  return contract.catalog;
}
