import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/context-menu/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_CONTEXT_MENU_DOCS } from './context-menu.docs';
import * as contextMenuStories from './context-menu.stories';

describe('Context menu stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.contextMenu, contextMenuStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.contextMenu,
        REACT_CONTEXT_MENU_DOCS.contextMenu.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_CONTEXT_MENU_DOCS.contextMenu,
        framework: 'React',
        member: contract.members.contextMenu,
        scenarioIds: contract.scenarios.contextMenu,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_CONTEXT_MENU_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
