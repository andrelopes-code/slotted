import type { ReferenceDocs } from '@slotted/storybook-workbench';

export type Binding = 'react' | 'angular';
export type BlockVerdict = 'example' | 'excerpt';

/** The shelves of `specs/contract.schema.mjs`, in its order; a test holds the two equal. */
export const GROUPS = [
  'Actions',
  'Forms',
  'Data display',
  'Feedback',
  'Navigation',
  'Overlays',
  'Layout',
] as const;

export interface ContractMemberInput {
  nativeElement: string;
  defaults?: Readonly<Record<string, unknown>>;
  parts?: readonly string[];
  states?: readonly string[];
}

export interface ContractInput {
  family: string;
  ui: string;
  catalog: { group: string; summary: string };
  /** Mostly string values; a boolean axis (`modal`, `sticky`) lists `true` and `false`. */
  axes?: Readonly<Record<string, readonly (string | number | boolean)[]>>;
  members: Readonly<Record<string, ContractMemberInput>>;
}

export interface SiteExample {
  /** File name without its extension; replaces the scene with the same id. */
  id: string;
  fileName: string;
  language: 'tsx' | 'ts';
  source: string;
}

export interface FamilyInput {
  binding: Binding;
  contract: ContractInput;
  /** Key: the export key of `<BINDING>_<FAMILY>_DOCS`, one per documented member. */
  docs: Readonly<Record<string, ReferenceDocs>>;
  tokens: readonly string[];
  examples: readonly SiteExample[];
  /** Key: a snippet id, or `site:<id>` for a site example. Absent means excerpt. */
  verdicts: ReadonlyMap<string, BlockVerdict>;
}

export interface RenderedFile {
  path: string;
  content: string;
}

export interface RenderedFamily {
  files: readonly RenderedFile[];
}

export const BUDGETS = { index: 8192, family: 24576, snippet: 2048 } as const;

export const DOCS_DIR: Readonly<Record<Binding, string>> = {
  react: 'node_modules/@slotted/react/dist/docs',
  angular: 'node_modules/@slotted/angular/docs',
};
