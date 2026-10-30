import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/prose/contract.json';
import { REACT_PROSE_DOCS } from './prose.docs';
import * as proseStories from './prose.stories';

describe('Prose stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.prose, proseStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(contract.members.prose, REACT_PROSE_DOCS.prose.api)).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it.
   *
   * There is no event table, and the checker does not ask for one: the contract
   * declares no state model, because the family holds no mutable value. The
   * page says so in as many words rather than leaving the absence to be
   * noticed.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_PROSE_DOCS.prose,
        framework: 'React',
        member: contract.members.prose,
        scenarioIds: contract.scenarios.prose,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_PROSE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
