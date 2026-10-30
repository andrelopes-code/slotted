import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/radio-group/contract.json';
import { ANGULAR_RADIO_GROUP_DOCS } from './radio-group.docs';
import * as radioGroupStories from './radio-group.stories';

describe('Angular RadioGroup stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.radioGroup, radioGroupStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_RADIO_GROUP_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_RADIO_GROUP_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_RADIO_GROUP_DOCS.radioGroup,
        framework: 'Angular',
        member: contract.members.radioGroup,
        scenarioIds: contract.scenarios.radioGroup,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_RADIO_GROUP_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
