import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/avatar-group/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_AVATAR_GROUP_DOCS } from './avatar-group.docs';
import * as avatarGroupStories from './avatar-group.stories';

describe('Avatar Group stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.avatarGroup, avatarGroupStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_AVATAR_GROUP_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_AVATAR_GROUP_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_AVATAR_GROUP_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
