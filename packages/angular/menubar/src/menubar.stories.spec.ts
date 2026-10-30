import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/menubar/contract.json';
import { ANGULAR_MENUBAR_DOCS } from './menubar.docs';
import * as menubarStories from './menubar.stories';

describe('Angular MENUBAR stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.menubar, menubarStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(contract.members.menubar, ANGULAR_MENUBAR_DOCS.menubar.api)).toEqual(
      [],
    );
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_MENUBAR_DOCS.menubar,
        framework: 'Angular',
        member: contract.members.menubar,
        scenarioIds: contract.scenarios.menubar,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_MENUBAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
