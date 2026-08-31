import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/pagination/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_PAGINATION_DOCS } from './pagination.docs';
import * as paginationStories from './pagination.stories';

describe('Pagination stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.pagination, paginationStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_PAGINATION_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_PAGINATION_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_PAGINATION_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
