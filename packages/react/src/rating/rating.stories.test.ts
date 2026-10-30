import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/rating/contract.json';
import * as ratingDisplayStories from './rating-display.stories';
import * as overviewStories from './rating-family.stories';
import * as ratingSummaryStories from './rating-summary.stories';
import { REACT_RATING_DOCS } from './rating.docs';
import * as ratingStories from './rating.stories';

const storyModules = {
  overview: overviewStories,
  rating: ratingStories,
  ratingDisplay: ratingDisplayStories,
  ratingSummary: ratingSummaryStories,
};

type Member = keyof typeof contract.members;
const members = Object.keys(contract.members) as Member[];

describe('Rating family stories', () => {
  it('covers every required scenario, on every page', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of members) {
      expect(apiMetadataErrors(contract.members[member], REACT_RATING_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract for each member', () => {
    for (const member of members) {
      expect(
        referencePageErrors({
          docs: REACT_RATING_DOCS[member],
          framework: 'React',
          member: contract.members[member],
          scenarioIds: contract.scenarios[member],
          ...(member === 'ratingDisplay' ? {} : { stateModel: contract.stateModel }),
        }),
      ).toEqual([]);
    }
  });

  /** The axes are what a consumer picks from, so every page spells every value. */
  it('spells every appearance axis in the reference API', () => {
    const spelled = (values: readonly string[]) => values.map((value) => `'${value}'`).join(' | ');
    for (const member of members) {
      const api = REACT_RATING_DOCS[member].api;
      expect(api.find((row) => row.name === 'size')?.type).toBe(spelled(contract.axes.size));
      expect(api.find((row) => row.name === 'tone')?.type).toBe(spelled(contract.axes.tone));
    }
    expect(REACT_RATING_DOCS.ratingDisplay.api.find((row) => row.name === 'variant')?.type).toBe(
      spelled(contract.axes.variant),
    );
    expect(REACT_RATING_DOCS.ratingSummary.api.find((row) => row.name === 'variant')?.type).toBe(
      spelled(contract.axes.summaryVariant),
    );
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_RATING_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
