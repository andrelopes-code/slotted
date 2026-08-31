import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/skeleton/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_SKELETON_DOCS } from './skeleton.docs';
import * as skeletonStories from './skeleton.stories';

describe('Skeleton stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.skeleton, skeletonStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_SKELETON_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_SKELETON_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_SKELETON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
