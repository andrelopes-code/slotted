import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/aspect-ratio/contract.json';
import { REACT_ASPECT_RATIO_DOCS } from './aspect-ratio.docs';
import * as aspectRatioStories from './aspect-ratio.stories';

describe('AspectRatio stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['aspect-ratio'], aspectRatioStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members['aspect-ratio'],
        REACT_ASPECT_RATIO_DOCS['aspect-ratio'].api,
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
        docs: REACT_ASPECT_RATIO_DOCS['aspect-ratio'],
        framework: 'React',
        member: contract.members['aspect-ratio'],
        scenarioIds: contract.scenarios['aspect-ratio'],
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_ASPECT_RATIO_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
