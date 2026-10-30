import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/datetime-field/contract.json';
import { REACT_DATE_TIME_FIELD_DOCS } from './datetime-field.docs';
import * as dateTimeFieldStories from './datetime-field.stories';

describe('DateTimeField stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.dateTimeField, dateTimeFieldStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_DATE_TIME_FIELD_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_DATE_TIME_FIELD_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  /**
   * The family holds one mutable value, so the page owes an event table as well
   * as the import, the anatomy and one captioned demonstration per scenario
   * with the code that produced it.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DATE_TIME_FIELD_DOCS.dateTimeField,
        framework: 'React',
        member: contract.members.dateTimeField,
        scenarioIds: contract.scenarios.dateTimeField,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_DATE_TIME_FIELD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
