import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/progress-bar/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { ANGULAR_PROGRESS_BAR_DOCS } from './progress-bar.docs';
import * as progressBarStories from './progress-bar.stories';

describe('Angular ProgressBar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.progressBar, progressBarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_PROGRESS_BAR_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_PROGRESS_BAR_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_PROGRESS_BAR_DOCS).flatMap((docs) => docs.snippets);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
