import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/field-group/contract.json';
import { REACT_FIELD_GROUP_DOCS } from './field-group.docs';
import * as fieldGroupStories from './field-group.stories';

describe('FieldGroup stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.fieldGroup, fieldGroupStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_FIELD_GROUP_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_FIELD_GROUP_DOCS[member].api),
      ).toEqual([]);
    }
  });

  /**
   * The group is told its state and holds none, so it declares no state model
   * and the page owes no event table. Everything else the contract requires —
   * the import, the anatomy, one captioned demonstration per scenario with the
   * code that produced it — is checked here.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_FIELD_GROUP_DOCS.fieldGroup,
        framework: 'React',
        member: contract.members.fieldGroup,
        scenarioIds: contract.scenarios.fieldGroup,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_FIELD_GROUP_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
