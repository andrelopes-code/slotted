import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/slider/contract.json';
import { REACT_SLIDER_DOCS } from './slider.docs';
import * as sliderStories from './slider.stories';

describe('Slider stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.slider, sliderStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_SLIDER_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_SLIDER_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  /**
   * The family holds one mutable value, so the page owes an event table as well
   * as the import, the anatomy and one captioned demonstration per scenario
   * with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_SLIDER_DOCS.slider,
        framework: 'React',
        member: contract.members.slider,
        scenarioIds: contract.scenarios.slider,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_SLIDER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
