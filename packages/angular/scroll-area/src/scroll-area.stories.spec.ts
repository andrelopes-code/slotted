import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/scroll-area/contract.json';
import { ANGULAR_SCROLL_AREA_DOCS } from './scroll-area.docs';
import * as scrollAreaStories from './scroll-area.stories';

describe('Angular ScrollArea stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.scrollArea, scrollAreaStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.scrollArea,
        ANGULAR_SCROLL_AREA_DOCS.scrollArea.api,
        undefined,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_SCROLL_AREA_DOCS.scrollArea,
        framework: 'Angular',
        member: contract.members.scrollArea,
        scenarioIds: contract.scenarios.scrollArea,
        stateModel: undefined,
      }),
    ).toEqual([]);
  });

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_SCROLL_AREA_DOCS.scrollArea.snippets,
      ...ANGULAR_SCROLL_AREA_DOCS.scrollArea.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
