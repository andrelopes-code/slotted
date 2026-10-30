import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/carousel/contract.json';
import { REACT_CAROUSEL_DOCS } from './carousel.docs';
import * as carouselStories from './carousel.stories';

describe('Carousel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.carousel, carouselStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.carousel,
        REACT_CAROUSEL_DOCS.carousel.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * The family holds two values a consumer can own, the page and the
   * rotation, so the page owes an event table beside the import, the anatomy
   * and one captioned demonstration per scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_CAROUSEL_DOCS.carousel,
        framework: 'React',
        member: contract.members.carousel,
        scenarioIds: contract.scenarios.carousel,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...REACT_CAROUSEL_DOCS.carousel.snippets,
      ...REACT_CAROUSEL_DOCS.carousel.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
