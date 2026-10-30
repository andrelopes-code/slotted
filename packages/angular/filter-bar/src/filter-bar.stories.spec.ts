import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/filter-bar/contract.json';
import { ANGULAR_FILTER_BAR_DOCS } from './filter-bar.docs';
import * as filterBarStories from './filter-bar.stories';

describe('Angular FilterBar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.filterBar, filterBarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_FILTER_BAR_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_FILTER_BAR_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * which elements the directives attach to, what it is made of, one captioned
   * demonstration per scenario with the code that produced it, and — because
   * the contract declares a state model — the event that moves it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_FILTER_BAR_DOCS.filterBar,
        framework: 'Angular',
        member: contract.members.filterBar,
        scenarioIds: contract.scenarios.filterBar,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_FILTER_BAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
