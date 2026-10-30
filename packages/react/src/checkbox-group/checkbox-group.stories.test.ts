import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/checkbox-group/contract.json';
import { REACT_CHECKBOX_GROUP_DOCS } from './checkbox-group.docs';
import * as checkboxGroupStories from './checkbox-group.stories';

describe('CheckboxGroup stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.checkboxGroup, checkboxGroupStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_CHECKBOX_GROUP_DOCS
    >) {
      expect(
        apiMetadataErrors(contract.members[member], REACT_CHECKBOX_GROUP_DOCS[member].api),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_CHECKBOX_GROUP_DOCS.checkboxGroup,
        framework: 'React',
        member: contract.members.checkboxGroup,
        scenarioIds: contract.scenarios.checkboxGroup,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_CHECKBOX_GROUP_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
