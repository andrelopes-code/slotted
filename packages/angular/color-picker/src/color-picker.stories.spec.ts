import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/color-picker/contract.json';
import { ANGULAR_COLOR_PICKER_DOCS } from './color-picker.docs';
import * as colorPickerStories from './color-picker.stories';

describe('Angular ColorPicker stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.colorPicker, colorPickerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(
        apiMetadataErrors(contract.members[member], ANGULAR_COLOR_PICKER_DOCS.colorPicker.api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_COLOR_PICKER_DOCS.colorPicker,
        framework: 'Angular',
        member: contract.members.colorPicker,
        scenarioIds: contract.scenarios.colorPicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_COLOR_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
