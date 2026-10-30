import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/entity-picker/contract.json';
import { ANGULAR_ENTITY_PICKER_DOCS } from './entity-picker.docs';
import * as entityPickerStories from './entity-picker.stories';

const docs = ANGULAR_ENTITY_PICKER_DOCS['entity-picker'];
const member = contract.members['entity-picker'];

describe('SlEntityPicker stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios['entity-picker'], entityPickerStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(member, docs.api, contract.stateModel)).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs,
        framework: 'Angular',
        member,
        scenarioIds: contract.scenarios['entity-picker'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [...docs.snippets, ...docs.scenes.map((scene) => scene.snippet)];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
