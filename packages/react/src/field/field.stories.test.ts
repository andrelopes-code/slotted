import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/field/contract.json';
import { REACT_FIELD_DOCS } from './field.docs';
import * as fieldStories from './field.stories';

describe('Field stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.field, fieldStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_FIELD_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_FIELD_DOCS[member].api)).toEqual([]);
    }
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * what it is made of, and one captioned demonstration per scenario with the
   * code that produced it. No event table is required, and the absence is the
   * contract's rather than an oversight — the field is told its state and holds
   * none, so it declares no state model and emits nothing.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_FIELD_DOCS.field,
        framework: 'React',
        member: contract.members.field,
        scenarioIds: contract.scenarios.field,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_FIELD_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
