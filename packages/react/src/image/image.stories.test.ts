import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/image/contract.json';
import { REACT_IMAGE_DOCS } from './image.docs';
import * as imageStories from './image.stories';

describe('Image stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.image, imageStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(contract.members.image, REACT_IMAGE_DOCS.image.api)).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_IMAGE_DOCS.image,
        framework: 'React',
        member: contract.members.image,
        scenarioIds: contract.scenarios.image,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_IMAGE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
