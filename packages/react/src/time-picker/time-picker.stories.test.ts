import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/time-picker/contract.json';
import { REACT_TIME_PICKER_DOCS } from './time-picker.docs';
import * as timePickerStories from './time-picker.stories';

describe('TimePicker stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.timePicker, timePickerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TIME_PICKER_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_TIME_PICKER_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * The family holds three mutable values, so the page owes three event rows —
   * the value, the surface and the highlight — as well as the import, the
   * anatomy and one captioned demonstration per scenario with its source.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TIME_PICKER_DOCS.timePicker,
        framework: 'React',
        member: contract.members.timePicker,
        scenarioIds: contract.scenarios.timePicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TIME_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
