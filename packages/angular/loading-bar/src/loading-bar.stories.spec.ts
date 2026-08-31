import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/loading-bar/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_LOADING_BAR_DOCS } from './loading-bar.docs';
import * as loadingBarStories from './loading-bar.stories';

describe('Angular LoadingBar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.loadingBar, loadingBarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_LOADING_BAR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_LOADING_BAR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_LOADING_BAR_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
