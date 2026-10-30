import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/description-list/contract.json';
import { REACT_DESCRIPTION_LIST_DOCS } from './description-list.docs';
import * as descriptionListStories from './description-list.stories';

describe('Description List stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.descriptionList, descriptionListStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_DESCRIPTION_LIST_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_DESCRIPTION_LIST_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares a state model — the
   * event that moves it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DESCRIPTION_LIST_DOCS.descriptionList,
        framework: 'React',
        member: contract.members.descriptionList,
        scenarioIds: contract.scenarios.descriptionList,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = Object.values(REACT_DESCRIPTION_LIST_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
