import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/filter-bar/contract.json';
import { REACT_FILTER_BAR_DOCS } from './filter-bar.docs';
import * as filterBarStories from './filter-bar.stories';

describe('FilterBar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.filterBar, filterBarStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.filterBar,
        REACT_FILTER_BAR_DOCS.filterBar.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, one captioned demonstration per scenario with the code
   * that produced it, and — because the contract declares five state models —
   * the events that move them.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_FILTER_BAR_DOCS.filterBar,
        framework: 'React',
        member: contract.members.filterBar,
        scenarioIds: contract.scenarios.filterBar,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = [
      ...REACT_FILTER_BAR_DOCS.filterBar.snippets,
      ...REACT_FILTER_BAR_DOCS.filterBar.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
