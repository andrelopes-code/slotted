import type { AnatomyRow, ApiRow, EventRow } from './api-table';
import type { ReferenceImport } from './reference-page';
import type { WorkbenchSnippet } from './snippets';

/**
 * A scene as the docs module declares it: the scenario it answers, what to
 * look at, and the code that produced it. The story itself is bound in the
 * stories module, where the story objects exist; keeping the metadata here is
 * what lets a test read a page's demonstrations without importing Storybook.
 */
export interface ReferenceSceneMeta {
  id: string;
  title: string;
  note: string;
  snippet: WorkbenchSnippet;
}

export interface ReferenceDocs {
  accessibility: readonly string[];
  anatomy?: readonly AnatomyRow[];
  api: readonly ApiRow[];
  composition?: readonly ApiRow[];
  events?: readonly EventRow[];
  imports?: ReferenceImport;
  scenes?: readonly ReferenceSceneMeta[];
  snippets: readonly WorkbenchSnippet[];
}

export interface ReferenceContractMember {
  parts: readonly string[];
  states: readonly string[];
}

/**
 * A family that can move a value has to say what it emits when it moves, what
 * the payload carries and when it arrives. The contract already declares the
 * model; this is what stops the page from declaring it and never showing it.
 */
export interface ReferenceContract {
  member: ReferenceContractMember;
  stateModel?: Record<string, unknown> | undefined;
}

/** A caption shorter than this says the title again instead of saying what to look at. */
const NOTE_MINIMUM = 40;

/**
 * What a reference page owes a reader who has never seen the family: what to
 * import, what it is made of, one demonstration per scenario with its source,
 * and a table for every kind of thing the family exposes. Each rule here
 * exists because a page shipped without it and the gap was found by a reader
 * rather than by a test.
 */
export function referencePageErrors({
  docs,
  framework,
  member,
  scenarioIds,
  stateModel,
}: {
  docs: ReferenceDocs;
  framework: 'Angular' | 'React';
  member: ReferenceContractMember;
  scenarioIds: readonly string[];
  stateModel?: Record<string, unknown> | undefined;
}): string[] {
  const errors: string[] = [];

  if (stateModel !== undefined && Object.keys(stateModel).length > 0) {
    if ((docs.events ?? []).length === 0) {
      errors.push(
        'missing events: the contract declares a state model and the page shows no output',
      );
    }
  }

  if (docs.imports === undefined) {
    errors.push('missing imports: a page that never says what to import documents a picture');
  } else {
    if (!docs.imports.source.includes('import')) errors.push('imports.source is not an import');
    if (framework === 'Angular' && !docs.imports.selector) {
      errors.push(
        'missing imports.selector: an Angular page has to name the element it attaches to',
      );
    }
  }

  const anatomy = docs.anatomy ?? [];
  if (anatomy.length === 0) {
    errors.push('missing anatomy: the contract declares parts and the page names none');
  } else {
    const documented = anatomy.map((row) => row.part);
    for (const part of member.parts) {
      if (!documented.includes(part)) errors.push(`missing anatomy ${part}`);
    }
    for (const part of documented) {
      if (!member.parts.includes(part)) errors.push(`unknown anatomy ${part}`);
    }
    for (const row of anatomy) {
      if (row.element.trim().length === 0) errors.push(`anatomy ${row.part} names no element`);
      if (row.purpose.trim().length === 0) errors.push(`anatomy ${row.part} states no purpose`);
    }
  }

  const scenes = docs.scenes ?? [];
  if (scenes.length === 0) {
    errors.push('missing scenes: a page with no demonstration of its own shows two of them');
  }
  const sceneIds = scenes.map((scene) => scene.id);
  for (const id of scenarioIds) {
    if (!sceneIds.includes(id)) errors.push(`missing scene ${id}`);
  }
  for (const id of sceneIds) {
    if (!scenarioIds.includes(id)) errors.push(`unknown scene ${id}`);
    if (sceneIds.filter((candidate) => candidate === id).length > 1) {
      errors.push(`duplicate scene ${id}`);
    }
  }
  for (const scene of scenes) {
    if (scene.title.trim().length === 0) errors.push(`scene ${scene.id} has no title`);
    if (scene.note.trim().length < NOTE_MINIMUM) {
      errors.push(`scene ${scene.id} needs a caption saying what to look at`);
    }
    /**
     * An Angular story writes its scene into a template, and a template reads
     * `@` as the start of a control-flow block. A caption that mentioned `@if`
     * in prose left the compiler looking for a block that never closed, and the
     * scene rendered as `Incomplete block "if keeps a closed detail out of the
     * DOM entirely"` instead of as a demonstration — a defect a screenshot
     * shows and no type or lint can. The escape the compiler itself suggests is
     * `&#64;`, and it is what a caption that has to name the syntax writes.
     */
    if (framework === 'Angular' && /@(?!#?\w+;)/.test(`${scene.title} ${scene.note}`)) {
      errors.push(
        `scene ${scene.id} writes a bare @ in prose, which an Angular template reads as a block`,
      );
    }
  }

  if (docs.accessibility.length < 3) {
    errors.push('accessibility says less than three things about a family that has states');
  }

  return [...new Set(errors)];
}
