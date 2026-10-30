import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/navigation-menu/contract.json';
import { REACT_NAVIGATION_MENU_DOCS } from './navigation-menu.docs';
import * as navigationMenuStories from './navigation-menu.stories';

describe('NavigationMenu stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.navigationMenu, navigationMenuStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.navigationMenu,
        REACT_NAVIGATION_MENU_DOCS.navigationMenu.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_NAVIGATION_MENU_DOCS.navigationMenu,
        framework: 'React',
        member: contract.members.navigationMenu,
        scenarioIds: contract.scenarios.navigationMenu,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const docs = REACT_NAVIGATION_MENU_DOCS.navigationMenu;
    const snippets = [...docs.snippets, ...docs.scenes.map((scene) => scene.snippet)];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
