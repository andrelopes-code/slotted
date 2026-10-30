import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/divider/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_DIVIDER_DOCS } from './divider.docs';
import * as dividerStories from './divider.stories';

describe('Angular Divider stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.divider, dividerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_DIVIDER_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_DIVIDER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DIVIDER_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
