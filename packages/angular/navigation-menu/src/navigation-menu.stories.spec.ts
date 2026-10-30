import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/navigation-menu/contract.json';
import { ANGULAR_NAVIGATION_MENU_DOCS } from './navigation-menu.docs';
import * as navigationMenuStories from './navigation-menu.stories';

describe('SlNavigationMenu stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.navigationMenu, navigationMenuStories),
    ).toEqual([]);
  });

  /** A `model<…>` row is both halves of the state model at once, and the check reads it so. */
  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_NAVIGATION_MENU_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_NAVIGATION_MENU_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_NAVIGATION_MENU_DOCS.navigationMenu,
        framework: 'Angular',
        member: contract.members.navigationMenu,
        scenarioIds: contract.scenarios.navigationMenu,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_NAVIGATION_MENU_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
