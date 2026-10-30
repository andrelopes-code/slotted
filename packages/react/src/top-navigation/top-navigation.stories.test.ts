import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/top-navigation/contract.json';
import { REACT_TOP_NAVIGATION_DOCS } from './top-navigation.docs';
import * as topNavigationStories from './top-navigation.stories';

describe('TopNavigation stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.topNavigation, topNavigationStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TOP_NAVIGATION_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_TOP_NAVIGATION_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TOP_NAVIGATION_DOCS.topNavigation,
        framework: 'React',
        member: contract.members.topNavigation,
        scenarioIds: contract.scenarios.topNavigation,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TOP_NAVIGATION_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
