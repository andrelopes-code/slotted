import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/color-picker/contract.json';
import { REACT_COLOR_PICKER_DOCS } from './color-picker.docs';
import * as colorPickerStories from './color-picker.stories';

describe('ColorPicker stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.colorPicker, colorPickerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof contract.members>) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_COLOR_PICKER_DOCS.colorPicker.api),
      ).toEqual([]);
    }
  });

  /**
   * The family holds three mutable values, so the page owes an event table as
   * well as the import, the anatomy and one captioned demonstration per
   * scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_COLOR_PICKER_DOCS.colorPicker,
        framework: 'React',
        member: contract.members.colorPicker,
        scenarioIds: contract.scenarios.colorPicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_COLOR_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
