import '@angular/compiler';
import { Component } from '@angular/core';
import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlFilterBar } from '@slotted/angular/filter-bar';
import { SlImage } from '@slotted/angular/image';
import {
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
} from '@slotted/angular/pagination';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/data-grid/contract.json';
import { SlDataGrid } from './data-grid';
import {
  SlDataGridCellTemplate,
  SlDataGridColumnHelp,
  SlDataGridDetailTemplate,
  SlDataGridFooter,
} from './data-grid-templates';
import { ANGULAR_DATA_GRID_DOCS } from './data-grid.docs';
import * as dataGridStories from './data-grid.stories';
import { SavedViewDemo, UndoHideDemo } from './data-grid.stories';

const STORY_IMPORTS = [
  SavedViewDemo,
  UndoHideDemo,
  SlDataGrid,
  SlDataGridCellTemplate,
  SlDataGridColumnHelp,
  SlDataGridDetailTemplate,
  SlDataGridFooter,
  SlAvatar,
  SlBadge,
  SlButton,
  SlFilterBar,
  SlImage,
  SlPagination,
  SlPaginationNext,
  SlPaginationPageSize,
  SlPaginationPrevious,
  SlPaginationStatus,
  SlText,
  SlTextField,
  SlTextFieldInput,
];

describe('Data grid stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios['data-grid'], dataGridStories)).toEqual([]);
  });

  it('documents the public API', () => {
    expect(
      apiMetadataErrors(
        contract.members['data-grid'],
        ANGULAR_DATA_GRID_DOCS['data-grid'].api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  /**
   * What the page owes a reader who has never seen the family: what to import,
   * the selector, what it is made of, one captioned demonstration per scenario
   * with the code that produced it, and the outputs that move every model.
   */
  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_DATA_GRID_DOCS['data-grid'],
        framework: 'Angular',
        member: contract.members['data-grid'],
        scenarioIds: contract.scenarios['data-grid'],
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  /**
   * A story's template is compiled by Storybook at run time, where a binding to
   * a property the story never handed over, or an attribute no directive
   * answers, fails only once the page is opened. Every story is rendered here
   * the way Storybook renders it: its template on a host whose fields are its
   * props.
   */
  it('renders every story template with its props', async () => {
    const stories = Object.entries(dataGridStories).filter(
      ([name, story]) =>
        name !== 'default' && typeof (story as { render?: unknown }).render === 'function',
    );
    expect(stories.length).toBeGreaterThan(30);
    for (const [name, story] of stories) {
      const { render, args } = story as {
        render: (args: Record<string, unknown>) => {
          props: Record<string, unknown>;
          template: string;
        };
        args?: Record<string, unknown>;
      };
      const { props, template } = render(args ?? {});
      /* Storybook compiles a story's template just in time; so does this, through the
         decorator called as a function, which the AOT plugin leaves alone. */
      const StoryHost = Component({ standalone: true, imports: STORY_IMPORTS, template })(
        class {},
      ) as Type<object>;
      Object.assign(StoryHost.prototype, props);
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({ imports: [StoryHost] }).compileComponents();
      const fixture = TestBed.createComponent(StoryHost);
      Object.assign(fixture.componentInstance as object, props);
      expect(() => fixture.detectChanges(), name).not.toThrow();
      expect(
        fixture.nativeElement.querySelector('[role="grid"], [role="treegrid"]'),
        name,
      ).not.toBeNull();
      fixture.destroy();
    }
  }, 60_000);

  it('keeps curated Angular snippets formatted', async () => {
    const snippets = [
      ...ANGULAR_DATA_GRID_DOCS['data-grid'].snippets,
      ...ANGULAR_DATA_GRID_DOCS['data-grid'].scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
