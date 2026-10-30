import { describe, expect, it } from 'vitest';

import { processRules, splitTopLevel } from './rules';

describe('splitTopLevel', () => {
  it('keeps braces inside strings and drops top-level comments', () => {
    const css = `/* a } */ [data-ui='card']::before { content: "}"; }\n@media (width > 1px) { [data-ui='card'] { gap: 0; } }`;
    expect(splitTopLevel(css)).toEqual([
      `[data-ui='card']::before { content: "}"; }`,
      `@media (width > 1px) { [data-ui='card'] { gap: 0; } }`,
    ]);
  });

  it('refuses a closing brace with nothing open, so it cannot close the @scope around it', () => {
    expect(() => splitTopLevel('.a { color: red; } } .evil { color: blue; }')).toThrow(
      /unbalanced `\}`/,
    );
  });

  it('refuses a rule left with an open brace at the end', () => {
    expect(() => splitTopLevel('.a { color: red;')).toThrow(/unclosed `\{`/);
  });

  it('refuses a rule left with an open string at the end', () => {
    expect(() => splitTopLevel('.a { content: "x; } .b { }')).toThrow(/unterminated string/);
  });

  it('reads an escaped brace as part of the selector, so it cannot hide a closing brace', () => {
    expect(splitTopLevel('.a\\{ { color: red; }')).toEqual(['.a\\{ { color: red; }']);
    expect(() => splitTopLevel('.a\\{ } .b\\{ } [data-ui="button"]{color:red}')).toThrow(
      /unbalanced `\}`/,
    );
  });

  it('refuses a rule that ends in an escape, which would swallow the character after it', () => {
    expect(() => splitTopLevel('.a { color: red; } \\')).toThrow(/dangling escape/);
  });

  it('ends a string at an unescaped newline, as CSS does, and refuses it as unterminated', () => {
    expect(() =>
      splitTopLevel('[data-ui="card"] { content: "a\n} [data-ui="button"] { color: red; } "; }'),
    ).toThrow(/unterminated string/);
    expect(splitTopLevel('.a { content: "a\\\nb"; }')).toEqual(['.a { content: "a\\\nb"; }']);
  });

  it('refuses a rule left with an open comment at the end', () => {
    expect(() => splitTopLevel('.a { color: red; } /* unterminated')).toThrow(
      /unterminated comment/,
    );
  });
});

describe('processRules', () => {
  it('hoists keyframes with the theme prefix and rewrites the references to them', () => {
    const { hoisted, body } = processRules('aura', [
      `@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }
       [data-ui='badge'] { animation: pulse 1s infinite; animation-name: pulse; }
       @font-face { font-family: X; src: url(x.woff2); }`,
    ]);
    expect(hoisted).toEqual([
      '@keyframes slotted-aura-pulse { from { opacity: 0; } to { opacity: 1; } }',
      '@font-face { font-family: X; src: url(x.woff2); }',
    ]);
    expect(body).toBe(
      "[data-ui='badge'] { animation: slotted-aura-pulse 1s infinite; animation-name: slotted-aura-pulse; }",
    );
  });
});
