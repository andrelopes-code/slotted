import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/form/contract.json';
import { REACT_FORM_DOCS } from './form.docs';
import * as formStories from './form.stories';

describe('Form stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.form, formStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<keyof typeof REACT_FORM_DOCS>) {
      expect(apiMetadataErrors(contract.members[member], REACT_FORM_DOCS[member].api)).toEqual([]);
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
        docs: REACT_FORM_DOCS.form,
        framework: 'React',
        member: contract.members.form,
        scenarioIds: contract.scenarios.form,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_FORM_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
