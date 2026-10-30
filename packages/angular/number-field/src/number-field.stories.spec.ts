import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/number-field/contract.json';
import { ANGULAR_NUMBER_FIELD_DOCS } from './number-field.docs';
import * as numberFieldStories from './number-field.stories';

describe('SlNumberField stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.numberField, numberFieldStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_NUMBER_FIELD_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_NUMBER_FIELD_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_NUMBER_FIELD_DOCS.numberField,
        framework: 'Angular',
        member: contract.members.numberField,
        scenarioIds: contract.scenarios.numberField,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_NUMBER_FIELD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
