import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/date-picker/contract.json';
import { ANGULAR_DATE_PICKER_DOCS } from './date-picker.docs';
import * as datePickerStories from './date-picker.stories';

describe('Angular DatePicker stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.datePicker, datePickerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_DATE_PICKER_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_DATE_PICKER_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DATE_PICKER_DOCS.datePicker,
        framework: 'Angular',
        member: contract.members.datePicker,
        scenarioIds: contract.scenarios.datePicker,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DATE_PICKER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});

/**
 * An application whose API carries ISO dates could not find where PlainDate
 * comes from. The `value` row names the entry point and the two conversions.
 */
describe('Angular DatePicker docs, an ISO date', () => {
  it('names @slotted/core/date and the conversions under value', () => {
    const rows = Object.values(ANGULAR_DATE_PICKER_DOCS).flatMap((docs) => docs.api);
    const value = rows.find((row) => row.name === 'value');

    expect(value?.description).toMatch(/PlainDate is exported by @slotted\/core\/date/);
    expect(value?.description).toMatch(/parseISODate\(text\) returns a PlainDate or null/);
    expect(value?.description).toMatch(/toISODate\(date\) returns .YYYY-MM-DD./);
    expect(value?.description).toMatch(/isPlainDate\(value\) narrows the CalendarValue/);
  });
});
