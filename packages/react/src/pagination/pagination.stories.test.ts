import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/pagination/contract.json';
import { REACT_PAGINATION_DOCS } from './pagination.docs';
import * as paginationStories from './pagination.stories';

describe('Pagination stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.pagination, paginationStories)).toEqual([]);
  });

  /**
   * The state model names both pairs — `page`/`defaultPage` and
   * `pageSize`/`defaultPageSize` — and neither of them is called `value`, so
   * the contract is what the API table is checked against rather than the
   * workbench's own guess from the capability.
   */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_PAGINATION_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_PAGINATION_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares two state models —
   * the events that move them.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_PAGINATION_DOCS.pagination,
        framework: 'React',
        member: contract.members.pagination,
        scenarioIds: contract.scenarios.pagination,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_PAGINATION_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
