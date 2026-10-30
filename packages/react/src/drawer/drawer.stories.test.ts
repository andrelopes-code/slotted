import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/drawer/contract.json';
import { REACT_DRAWER_DOCS } from './drawer.docs';
import * as drawerStories from './drawer.stories';

describe('Drawer stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.drawer, drawerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(contract.members.drawer, REACT_DRAWER_DOCS.drawer.api, contract.stateModel),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_DRAWER_DOCS.drawer,
        framework: 'React',
        member: contract.members.drawer,
        scenarioIds: contract.scenarios.drawer,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...REACT_DRAWER_DOCS.drawer.snippets,
      ...REACT_DRAWER_DOCS.drawer.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
