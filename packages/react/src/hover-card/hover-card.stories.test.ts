import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/hover-card/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_HOVER_CARD_DOCS } from './hover-card.docs';
import * as hoverCardStories from './hover-card.stories';

describe('Hover card stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.hoverCard, hoverCardStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.hoverCard,
        REACT_HOVER_CARD_DOCS.hoverCard.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_HOVER_CARD_DOCS.hoverCard,
        framework: 'React',
        member: contract.members.hoverCard,
        scenarioIds: contract.scenarios.hoverCard,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_HOVER_CARD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
