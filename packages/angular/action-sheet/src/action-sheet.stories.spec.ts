import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/action-sheet/contract.json';
import { ANGULAR_ACTION_SHEET_DOCS } from './action-sheet.docs';
import * as actionSheetStories from './action-sheet.stories';

describe('SlActionSheet stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['action-sheet'], actionSheetStories)).toEqual(
      [],
    );
  });

  /**
   * The state model is deliberately not handed over here. `docs/state-and-events.md`
   * names the uncontrolled half `defaultOpen` for React and "initial input plus
   * internal state" for Angular, and a `model()` is both halves at once — so a
   * `defaultOpen` row would document an input this binding does not have.
   */
  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members['action-sheet'],
        ANGULAR_ACTION_SHEET_DOCS['action-sheet'].api,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_ACTION_SHEET_DOCS['action-sheet'],
        framework: 'Angular',
        member: contract.members['action-sheet'],
        scenarioIds: contract.scenarios['action-sheet'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_ACTION_SHEET_DOCS['action-sheet'].snippets,
      ...ANGULAR_ACTION_SHEET_DOCS['action-sheet'].scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
