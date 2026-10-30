import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/time-field/contract.json';
import { ANGULAR_TIME_FIELD_DOCS } from './time-field.docs';
import * as timeFieldStories from './time-field.stories';

describe('Angular TimeField stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.timeField, timeFieldStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_TIME_FIELD_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_TIME_FIELD_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_TIME_FIELD_DOCS.timeField,
        framework: 'Angular',
        member: contract.members.timeField,
        scenarioIds: contract.scenarios.timeField,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_TIME_FIELD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
