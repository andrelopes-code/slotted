import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/fullscreen/contract.json';
import { REACT_FULLSCREEN_DOCS } from './fullscreen.docs';
import * as fullscreenStories from './fullscreen.stories';

describe('Fullscreen stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.fullscreen, fullscreenStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_FULLSCREEN_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_FULLSCREEN_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_FULLSCREEN_DOCS.fullscreen,
        framework: 'React',
        member: contract.members.fullscreen,
        scenarioIds: contract.scenarios.fullscreen,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_FULLSCREEN_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
