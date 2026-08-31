import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/loading-bar/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_LOADING_BAR_DOCS } from './loading-bar.docs';
import * as loadingBarStories from './loading-bar.stories';

describe('LoadingBar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.loadingBar, loadingBarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_LOADING_BAR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_LOADING_BAR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_LOADING_BAR_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
