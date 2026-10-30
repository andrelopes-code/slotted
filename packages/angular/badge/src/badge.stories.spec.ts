import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/badge/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_BADGE_DOCS } from './badge.docs';
import * as badgeStories from './badge.stories';

describe('Angular Badge stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.badge, badgeStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_BADGE_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_BADGE_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_BADGE_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
