import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/carousel/contract.json';
import { ANGULAR_CAROUSEL_DOCS } from './carousel.docs';
import * as carouselStories from './carousel.stories';

describe('Angular Carousel stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.carousel, carouselStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.carousel,
        ANGULAR_CAROUSEL_DOCS.carousel.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_CAROUSEL_DOCS.carousel,
        framework: 'Angular',
        member: contract.members.carousel,
        scenarioIds: contract.scenarios.carousel,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_CAROUSEL_DOCS.carousel.snippets,
      ...ANGULAR_CAROUSEL_DOCS.carousel.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
