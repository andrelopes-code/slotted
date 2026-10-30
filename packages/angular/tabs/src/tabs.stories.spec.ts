import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/tabs/contract.json';
import { ANGULAR_TABS_DOCS } from './tabs.docs';
import * as tabsStories from './tabs.stories';

describe('Angular TABS stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.tabs, tabsStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_TABS_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_TABS_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_TABS_DOCS.tabs,
        framework: 'Angular',
        member: contract.members.tabs,
        scenarioIds: contract.scenarios.tabs,
        stateModel: 'stateModel' in contract ? contract.stateModel : undefined,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TABS_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
