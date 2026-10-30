import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

/**
 * A snippet language that belongs to neither binding. A family selected in
 * public by `data-ui` answers real questions with a stylesheet rule — the
 * default every instance takes, a weight the artwork's own grid decides — and
 * that rule is equally correct on both pages. The rule below is about a page
 * showing the *wrong framework's* code, which a stylesheet cannot be.
 *
 * `ts` is the same case on the other side. An application sets a family's
 * defaults once, and in Angular that lives in a bootstrap file rather than in a
 * template: it is TypeScript, which is the language both bindings are written
 * in, and it is not the other framework's code. The rule still refuses a `tsx`
 * snippet on an Angular page and an `angular` one on a React page, which is the
 * confusion it exists to catch.
 *
 * `markdown` is the input of the `markdown` family: the source a reader
 * writes, which the page shows beside the element it becomes. It is the same
 * text under either framework.
 */
const NEUTRAL_LANGUAGES = new Set(['css', 'markdown', 'ts']);

/**
 * A snippet that is the *same snippet* on both pages, rather than merely
 * written in a language neither framework owns. Only a stylesheet rule is: the
 * Angular `ts` snippet that provides a family's defaults is Angular's own, and
 * a React page's `ts` snippet of the same idea would be a different one, so
 * both ids have to name their framework or the two would collide. Markdown
 * source is shared in the same sense a stylesheet rule is.
 */
const SHARED_LANGUAGES = new Set(['css', 'markdown']);

/**
 * Each framework's reference pages are written by copying the other's and
 * editing them, which is how the two Storybooks stay scenario for scenario.
 * The one thing that copy cannot be trusted to change is the snippet language:
 * a `tsx` snippet in an Angular page still formats, still renders, and shows
 * the reader React code under an Angular badge.
 */
const FRAMEWORKS = [
  { language: 'tsx', name: 'React', roots: [join(ROOT, 'packages/react/src')] },
  {
    language: 'angular',
    name: 'Angular',
    roots: readdirSync(join(ROOT, 'packages/angular'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !['dist', 'node_modules'].includes(entry.name))
      .map((entry) => join(ROOT, 'packages/angular', entry.name, 'src')),
  },
];

function docsFiles(roots) {
  return roots.flatMap((root) => {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      return [];
    }
    return entries.flatMap((entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return docsFiles([path]);
      return entry.name.endsWith('.docs.ts') ? [path] : [];
    });
  });
}

/**
 * Read each `defineSnippet` call as one unit rather than scanning the file for
 * loose `id:` and `language:` lines: the two are paired, the pages do not agree
 * on key order, and an unpaired scan cannot tell which language a given id was
 * written in. Only the keys before `source` are read, so a snippet whose body
 * contains the word `language` is not mistaken for a second declaration.
 */
function declaredSnippets(source) {
  return source
    .split('defineSnippet(')
    .slice(1)
    .map((chunk) => {
      const [head, ...rest] = chunk.split(/\bsource:/);
      const body = rest.join('source:');
      const opened = body.indexOf('`');
      return {
        id: /id:\s*'([a-z0-9-]+)'/.exec(head)?.[1],
        language: /language:\s*'([a-z]+)'/.exec(head)?.[1],
        source: opened === -1 ? '' : body.slice(opened + 1, body.indexOf('`', opened + 1)),
      };
    });
}

/** The family a reference page belongs to, which is the file's own name. */
function familyOf(path) {
  return path.slice(path.lastIndexOf('/') + 1).replace('.docs.ts', '');
}

/**
 * The custom properties a snippet *sets*, as opposed to the ones it reads,
 * grouped by the family each block retunes. A theming snippet is a list of
 * rules, and the `data-ui` in a rule's selector says whose tokens the rule is
 * allowed to set: a family that renders a shared part retunes that part under
 * the part's own identifier, which is where its tokens live.
 */
function assignedTokens(source, fallback) {
  const blocks = [];
  for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const family = /data-ui='([a-z0-9-]+)'/.exec(selector)?.[1] ?? fallback;
    for (const [, token] of body.matchAll(/(--slotted-[a-z0-9-]+)\s*:/g)) {
      blocks.push({ family, token });
    }
  }
  return blocks;
}

/** What `<family>.tokens.json` declares, or nothing when there is no family. */
function declaredTokens(family) {
  try {
    return new Set(
      JSON.parse(
        readFileSync(join(ROOT, 'packages/styles/src', family, `${family}.tokens.json`), 'utf8'),
      ),
    );
  } catch {
    return undefined;
  }
}

test('reads the id and the language of every declared snippet', () => {
  const unreadable = [];

  for (const { roots } of FRAMEWORKS) {
    for (const path of docsFiles(roots)) {
      for (const snippet of declaredSnippets(readFileSync(path, 'utf8'))) {
        if (snippet.id === undefined || snippet.language === undefined) {
          unreadable.push(`${path.slice(ROOT.length)}: ${JSON.stringify(snippet)}`);
        }
      }
    }
  }

  assert.deepEqual(
    unreadable,
    [],
    `A snippet whose id or language cannot be read is a snippet the rules below skip:\n  ${unreadable.join('\n  ')}`,
  );
});

test('finds the reference pages of both frameworks', () => {
  for (const { name, roots } of FRAMEWORKS) {
    assert.ok(docsFiles(roots).length >= 5, `Found too few ${name} reference pages`);
  }
});

test('writes every snippet in the language of the page it is on', () => {
  const violations = [];

  for (const { language, roots } of FRAMEWORKS) {
    for (const path of docsFiles(roots)) {
      for (const { language: found } of declaredSnippets(readFileSync(path, 'utf8'))) {
        if (found !== language && !NEUTRAL_LANGUAGES.has(found)) {
          violations.push(`${path.slice(ROOT.length)}: a ${found} snippet on a ${language} page`);
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A reference page must show code in its own framework:\n  ${violations.join('\n  ')}`,
  );
});

test('gives every snippet an id naming the framework it belongs to', () => {
  const violations = [];

  for (const { language, roots } of FRAMEWORKS) {
    const marker = language === 'tsx' ? 'react' : 'angular';
    for (const path of docsFiles(roots)) {
      for (const { id, language: found } of declaredSnippets(readFileSync(path, 'utf8'))) {
        /**
         * A stylesheet snippet is the same rule on both pages, so its id names
         * neither framework — naming one would claim it belongs there, and the
         * other page's copy would then be the wrong name rather than a
         * collision.
         */
        if (SHARED_LANGUAGES.has(found)) {
          if (id.includes('react') || id.includes('angular')) {
            violations.push(`${path.slice(ROOT.length)}: ${found} snippet ${id} names a framework`);
          }
        } else if (!id.includes(marker)) {
          violations.push(`${path.slice(ROOT.length)}: snippet ${id} does not name ${marker}`);
        }
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    `A snippet id carries its framework, so a copied page cannot collide:\n  ${violations.join('\n  ')}`,
  );
});

/**
 * A `*-theming` snippet is the list of decisions a consumer may take, and a
 * reader copies it into their own stylesheet. A property the family's sheet
 * does not read changes nothing there, and the reader has no way to find that
 * out: `radio-group` showed `--slotted-radio-group-checked-background` and
 * `--slotted-radio-group-mark-inset` for a whole rebuild after CK5 took both
 * out of the sheet and the contract (CK8).
 *
 * `<family>.tokens.json` is the list the family's own test derives from its
 * stylesheets, so it is the same fact the reference page prints beside the
 * snippet. Only the properties the snippet *sets* are held: what it reads on
 * the right of a colon is the theme's, and a consumer may reach for any of it.
 *
 * Each rule of the snippet is held against the family its own selector names,
 * so a page may retune a shared part it renders — `combobox` retunes the mark
 * under `[data-ui='highlight']`, which is where the mark has been painted since
 * CB6 — without the page claiming the part's tokens as its own.
 */
test('cites only the custom properties the family it documents reads', () => {
  const violations = [];
  const checked = [];

  for (const { roots } of FRAMEWORKS) {
    for (const path of docsFiles(roots)) {
      const page = familyOf(path);
      if (declaredTokens(page) === undefined) continue;
      for (const snippet of declaredSnippets(readFileSync(path, 'utf8'))) {
        if (!snippet.id?.endsWith('-theming')) continue;
        checked.push(`${page}:${snippet.id}`);
        for (const { family, token } of assignedTokens(snippet.source, page)) {
          const declared = declaredTokens(family);
          if (declared === undefined) {
            violations.push(`${path.slice(ROOT.length)}: ${snippet.id} retunes "${family}"`);
          } else if (!declared.has(token)) {
            violations.push(`${path.slice(ROOT.length)}: ${snippet.id} sets ${token} on ${family}`);
          }
        }
      }
    }
  }

  assert.ok(checked.length >= 20, `Only ${checked.length} theming snippets were read`);
  assert.deepEqual(
    violations,
    [],
    `A theming snippet must set properties its family's stylesheet reads:\n  ${violations.join('\n  ')}`,
  );
});
