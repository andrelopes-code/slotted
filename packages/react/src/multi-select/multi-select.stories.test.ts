import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { cleanup, render, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/multi-select/contract.json';
import { REACT_MULTI_SELECT_DOCS } from './multi-select.docs';
import * as multiSelectStories from './multi-select.stories';

describe('MultiSelect stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['multi-select'], multiSelectStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members['multi-select'],
        REACT_MULTI_SELECT_DOCS['multi-select'].api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_MULTI_SELECT_DOCS['multi-select'],
        framework: 'React',
        member: contract.members['multi-select'],
        scenarioIds: contract.scenarios['multi-select'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_MULTI_SELECT_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });

  /**
   * A story opens its popup for the picture, on its own page. Inside the
   * reference page the same story is one demonstration among many, and a layer
   * nobody asked for is open over the demonstration below it.
   */
  describe('a layer opened for the picture', () => {
    afterEach(cleanup);

    type Pictured = (args: never, context: never) => ReactNode;
    const mount = (story: Pictured, viewMode: string) =>
      render(createElement(() => story({} as never, { viewMode } as never)));

    const pictured = Object.values(multiSelectStories)
      .filter((story) => typeof story === 'object' && story !== null && 'render' in story)
      .map((story) => (story as { render: Pictured }).render);

    it('opens on a story of its own', async () => {
      let opened = 0;
      for (const story of pictured) {
        const { container } = mount(story, 'story');
        await waitFor(() => container);
        opened += container.querySelectorAll(
          "[data-ui='multi-select'][data-part='positioner'][data-open]",
        ).length;
        cleanup();
      }
      expect(opened).toBeGreaterThan(0);
    });

    it('mounts no layer on the reference page until the reader asks', async () => {
      for (const story of pictured) {
        const { container } = mount(story, 'docs');
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(
          container.querySelectorAll("[data-ui='multi-select'][data-part='positioner']"),
        ).toHaveLength(0);
        cleanup();
      }
    });
  });
});
