import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/collapsible/contract.json';
import { REACT_COLLAPSIBLE_DOCS } from './collapsible.docs';
import * as collapsibleStories from './collapsible.stories';

describe('Collapsible stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.collapsible, collapsibleStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_COLLAPSIBLE_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_COLLAPSIBLE_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_COLLAPSIBLE_DOCS.collapsible,
        framework: 'React',
        member: contract.members.collapsible,
        scenarioIds: contract.scenarios.collapsible,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_COLLAPSIBLE_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
