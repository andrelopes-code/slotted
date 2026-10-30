import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/action-sheet/contract.json';
import { REACT_ACTION_SHEET_DOCS } from './action-sheet.docs';
import * as actionSheetStories from './action-sheet.stories';

describe('ActionSheet stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['action-sheet'], actionSheetStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members['action-sheet'],
        REACT_ACTION_SHEET_DOCS['action-sheet'].api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_ACTION_SHEET_DOCS['action-sheet'],
        framework: 'React',
        member: contract.members['action-sheet'],
        scenarioIds: contract.scenarios['action-sheet'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...REACT_ACTION_SHEET_DOCS['action-sheet'].snippets,
      ...REACT_ACTION_SHEET_DOCS['action-sheet'].scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
