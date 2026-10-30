import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/table/contract.json';
import { REACT_TABLE_DOCS } from './table.docs';
import * as tableStories from './table.stories';

describe('Table stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.table, tableStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_TABLE_DOCS>) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_TABLE_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares three state models —
   * the events that move them.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TABLE_DOCS.table,
        framework: 'React',
        member: contract.members.table,
        scenarioIds: contract.scenarios.table,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_TABLE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
