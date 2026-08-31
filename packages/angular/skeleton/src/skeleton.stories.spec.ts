import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/skeleton/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_SKELETON_DOCS } from './skeleton.docs';
import * as skeletonStories from './skeleton.stories';

describe('Angular Skeleton stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.skeleton, skeletonStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_SKELETON_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_SKELETON_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_SKELETON_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
