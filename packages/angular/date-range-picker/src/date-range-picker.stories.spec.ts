import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/date-range-picker/contract.json';
import { ANGULAR_DATE_RANGE_PICKER_DOCS } from './date-range-picker.docs';
import * as dateRangePickerStories from './date-range-picker.stories';

describe('Angular DateRangePicker stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.dateRangePicker, dateRangePickerStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_DATE_RANGE_PICKER_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_DATE_RANGE_PICKER_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DATE_RANGE_PICKER_DOCS.dateRangePicker,
        framework: 'Angular',
        member: contract.members.dateRangePicker,
        scenarioIds: contract.scenarios.dateRangePicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DATE_RANGE_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
