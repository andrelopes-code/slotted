import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/time-range-picker/contract.json';
import { REACT_TIME_RANGE_PICKER_DOCS } from './time-range-picker.docs';
import * as timeRangePickerStories from './time-range-picker.stories';

describe('TimeRangePicker stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.timeRangePicker, timeRangePickerStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TIME_RANGE_PICKER_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_TIME_RANGE_PICKER_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * The family holds one mutable value, so the page owes an event table as
   * well as the import, the anatomy and one captioned demonstration per
   * scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TIME_RANGE_PICKER_DOCS.timeRangePicker,
        framework: 'React',
        member: contract.members.timeRangePicker,
        scenarioIds: contract.scenarios.timeRangePicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TIME_RANGE_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
