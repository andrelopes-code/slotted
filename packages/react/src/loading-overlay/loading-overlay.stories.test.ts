import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/loading-overlay/contract.json';
import { REACT_LOADING_OVERLAY_DOCS } from './loading-overlay.docs';
import * as loadingOverlayStories from './loading-overlay.stories';

describe('Loading overlay stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.loadingOverlay, loadingOverlayStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.loadingOverlay,
        REACT_LOADING_OVERLAY_DOCS.loadingOverlay.api,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_LOADING_OVERLAY_DOCS.loadingOverlay,
        framework: 'React',
        member: contract.members.loadingOverlay,
        scenarioIds: contract.scenarios.loadingOverlay,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_LOADING_OVERLAY_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
