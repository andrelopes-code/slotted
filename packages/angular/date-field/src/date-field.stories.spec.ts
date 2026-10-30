import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/date-field/contract.json';
import { ANGULAR_DATE_FIELD_DOCS } from './date-field.docs';
import * as dateFieldStories from './date-field.stories';

describe('Angular DateField stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.dateField, dateFieldStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof ANGULAR_DATE_FIELD_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          ANGULAR_DATE_FIELD_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DATE_FIELD_DOCS.dateField,
        framework: 'Angular',
        member: contract.members.dateField,
        scenarioIds: contract.scenarios.dateField,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DATE_FIELD_DOCS).flatMap((docs) => [
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
describe('Angular DateField docs, an ISO date', () => {
  it('names @slotted/core/date and the conversions under value', () => {
    const rows = Object.values(ANGULAR_DATE_FIELD_DOCS).flatMap((docs) => docs.api);
    const value = rows.find((row) => row.name === 'value');

    expect(value?.description).toMatch(/PlainDate is exported by @slotted\/core\/date/);
    expect(value?.description).toMatch(/parseISODate\(text\) returns a PlainDate or null/);
    expect(value?.description).toMatch(/toISODate\(date\) returns .YYYY-MM-DD./);
  });
});
