import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/loading-overlay/contract.json';
import { ANGULAR_LOADING_OVERLAY_DOCS } from './loading-overlay.docs';
import * as loadingOverlayStories from './loading-overlay.stories';

describe('Angular Loading overlay stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.loadingOverlay, loadingOverlayStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.loadingOverlay,
        ANGULAR_LOADING_OVERLAY_DOCS.loadingOverlay.api,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which element the directive attaches to, what it is made of, and one
   * captioned demonstration per scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_LOADING_OVERLAY_DOCS.loadingOverlay,
        framework: 'Angular',
        member: contract.members.loadingOverlay,
        scenarioIds: contract.scenarios.loadingOverlay,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_LOADING_OVERLAY_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
