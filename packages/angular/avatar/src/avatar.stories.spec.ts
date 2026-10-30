import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/avatar/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_AVATAR_DOCS } from './avatar.docs';
import * as avatarStories from './avatar.stories';

describe('Angular Avatar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.avatar, avatarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_AVATAR_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_AVATAR_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_AVATAR_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
