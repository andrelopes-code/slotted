import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/segmented-control/contract.json';
import { REACT_SEGMENTED_CONTROL_DOCS } from './segmented-control.docs';
import * as segmentedControlStories from './segmented-control.stories';

describe('SegmentedControl stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.segmentedControl, segmentedControlStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    for (const member of Object.keys(contract.members) as Array<
      keyof typeof REACT_SEGMENTED_CONTROL_DOCS
    >) {
      expect(
        apiMetadataErrors(
          contract.members[member],
          REACT_SEGMENTED_CONTROL_DOCS[member].api,
          contract.stateModel,
        ),
      ).toEqual([]);
    }
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_SEGMENTED_CONTROL_DOCS.segmentedControl,
        framework: 'React',
        member: contract.members.segmentedControl,
        scenarioIds: contract.scenarios.segmentedControl,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_SEGMENTED_CONTROL_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
