import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/result-state/contract.json';
import { REACT_RESULT_STATE_DOCS } from './result-state.docs';
import * as resultStateStories from './result-state.stories';

describe('Result State stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.resultState, resultStateStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_RESULT_STATE_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_RESULT_STATE_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   *
   * There is no event table, and the checker does not ask for one: the contract
   * declares no state model, because the family holds no mutable value. The
   * page says so in as many words rather than leaving the absence to be noticed.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_RESULT_STATE_DOCS.resultState,
        framework: 'React',
        member: contract.members.resultState,
        scenarioIds: contract.scenarios.resultState,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_RESULT_STATE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
