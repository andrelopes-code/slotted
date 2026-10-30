import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/switch/contract.json';
import { ANGULAR_SWITCH_DOCS } from './switch.docs';
import * as switchStories from './switch.stories';

describe('Angular Switch stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.switch, switchStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof ANGULAR_SWITCH_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], ANGULAR_SWITCH_DOCS[member].api)).toEqual(
        [],
      );
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_SWITCH_DOCS.switch,
        framework: 'Angular',
        member: contract.members.switch,
        scenarioIds: contract.scenarios.switch,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_SWITCH_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
