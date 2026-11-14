import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/sparkline/contract.json';
import { REACT_SPARKLINE_DOCS } from './sparkline.docs';
import * as barCompareStories from './bar-compare.stories';
import * as positionStripStories from './position-strip.stories';
import * as sparklineStories from './sparkline.stories';

const storyModules = {
  sparkline: sparklineStories,
  positionStrip: positionStripStories,
  barCompare: barCompareStories,
};

describe('Sparkline stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_SPARKLINE_DOCS
    >) {
      expect(apiMetadataErrors(contract.members[member], REACT_SPARKLINE_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   */
  it('answers the reference-page contract', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(
        referencePageErrors({
          docs: REACT_SPARKLINE_DOCS[member],
          framework: 'React',
          member: contract.members[member],
          scenarioIds: contract.scenarios[member],
        }),
      ).toEqual([]);
    }
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_SPARKLINE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
