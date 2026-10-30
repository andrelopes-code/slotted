import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/drawer/contract.json';
import { ANGULAR_DRAWER_DOCS } from './drawer.docs';
import * as drawerStories from './drawer.stories';

describe('SlDrawer stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.drawer, drawerStories)).toEqual([]);
  });

  /**
   * The state model is deliberately not handed over here. `docs/state-and-events.md`
   * names the uncontrolled half `defaultOpen` for React and "initial input plus
   * internal state" for Angular, and a `model()` is both halves at once — so a
   * `defaultOpen` row would document an input this binding does not have.
   */
  it('documents each public component API', () => {
    expect(apiMetadataErrors(contract.members.drawer, ANGULAR_DRAWER_DOCS.drawer.api)).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DRAWER_DOCS.drawer,
        framework: 'Angular',
        member: contract.members.drawer,
        scenarioIds: contract.scenarios.drawer,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_DRAWER_DOCS.drawer.snippets,
      ...ANGULAR_DRAWER_DOCS.drawer.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
