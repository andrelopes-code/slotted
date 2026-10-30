import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/text-field/contract.json';
import { REACT_TEXT_FIELD_DOCS } from './text-field.docs';
import * as textFieldStories from './text-field.stories';

describe('TextField stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.textField, textFieldStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_TEXT_FIELD_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_TEXT_FIELD_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * The family holds two mutable values, so the page owes an event table as
   * well as the import, the anatomy and one captioned demonstration per
   * scenario with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_TEXT_FIELD_DOCS.textField,
        framework: 'React',
        member: contract.members.textField,
        scenarioIds: contract.scenarios.textField,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_TEXT_FIELD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});

/**
 * A date, a time, a month or a number typed into a text field loses the
 * calendar, the segments and the parsing its own family gives it. The `type`
 * row names the six types the family supports and points every other one at
 * the family that owns it.
 */
describe('TextField docs, the type prop', () => {
  it('names the supported types and points a date at date-picker', () => {
    const rows = Object.values(REACT_TEXT_FIELD_DOCS).flatMap((docs) => docs.api);
    const type = rows.find((row) => row.name === 'type');

    expect(type?.description).not.toMatch(/Any other string an input accepts/);
    expect(type?.description).toMatch(/one of the six listed/);
    expect(type?.description).toMatch(/date-picker \(forms\.md FM-16\)/);
    expect(type?.description).toMatch(/time-picker or number-field/);
  });
});
