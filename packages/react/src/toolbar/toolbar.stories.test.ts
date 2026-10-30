import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/toolbar/contract.json';
import { REACT_TOOLBAR_DOCS } from './toolbar.docs';
import * as toolbarStories from './toolbar.stories';

describe('Toolbar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.toolbar, toolbarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_TOOLBAR_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_TOOLBAR_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TOOLBAR_DOCS.toolbar,
        framework: 'React',
        member: contract.members.toolbar,
        scenarioIds: contract.scenarios.toolbar,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TOOLBAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
