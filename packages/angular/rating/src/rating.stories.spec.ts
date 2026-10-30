import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/rating/contract.json';
import * as displayStories from './rating-display.stories';
import * as overviewStories from './rating-family.stories';
import * as summaryStories from './rating-summary.stories';
import { ANGULAR_RATING_DOCS } from './rating.docs';
import * as ratingStories from './rating.stories';

const storyModules = {
  overview: overviewStories,
  rating: ratingStories,
  ratingDisplay: displayStories,
  ratingSummary: summaryStories,
};

type Member = keyof typeof contract.members;
const MEMBERS = Object.keys(contract.members) as Member[];

/** The state model each member moves, as the contract names it; the display moves none. */
const STATE_MODELS: Record<Member, Record<string, unknown> | undefined> = {
  rating: { value: contract.stateModel.value },
  ratingDisplay: undefined,
  ratingSummary: { selection: contract.stateModel.selection },
};

describe('Angular Rating family stories', () => {
  it('covers every required scenario', () => {
    for (const page of Object.keys(contract.scenarios) as Array<keyof typeof contract.scenarios>) {
      expect(scenarioCoverageErrors(contract.scenarios[page], storyModules[page])).toEqual([]);
    }
  });

  it('documents each public component API', () => {
    for (const member of MEMBERS) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_RATING_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract for each member', () => {
    for (const member of MEMBERS) {
      expect(
        referencePageErrors({
          docs: ANGULAR_RATING_DOCS[member],
          framework: 'Angular',
          member: contract.members[member],
          scenarioIds: contract.scenarios[member],
          stateModel: STATE_MODELS[member],
        }),
      ).toEqual([]);
    }
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_RATING_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);

    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
