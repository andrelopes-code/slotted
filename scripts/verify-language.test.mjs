import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAllowedPath,
  isPortuguese,
  messageViolation,
  portugueseLines,
} from './verify-language.mjs';

test('flags a Portuguese sentence', () => {
  assert.equal(isPortuguese('O botão não abre o menu.'), true);
  assert.equal(isPortuguese('Configurações avançadas'), true);
  assert.equal(isPortuguese('uma linha para cada item'), true);
  assert.equal(isPortuguese('Relatórios do mês'), true);
  assert.equal(isPortuguese('Nota fiscal'), true);
  assert.equal(isPortuguese('Nenhum pedido'), true);
  assert.equal(isPortuguese('uma nota para o cliente'), true);
});

test('passes English text, names and domains', () => {
  assert.equal(isPortuguese('The button does not open the menu.'), false);
  assert.equal(isPortuguese('André Lopes <andre@example.com>'), false);
  assert.equal(isPortuguese('A café menu, para. 3'), false);
  assert.equal(isPortuguese("'São Paulo, Brazil' and 'Português (Brasil)'"), false);
  assert.equal(isPortuguese('see https://ui.shadcn.com/r/styles/base-nova/message.json'), false);
  assert.equal(isPortuguese('`base` treats `a`, `á` and `A` as one letter'), false);
});

test('numbers the flagged lines from one', () => {
  assert.deepEqual(portugueseLines('English line\nIsso não funciona\nAnother'), [2]);
});

test('allows only the pt-BR locale paths', () => {
  assert.equal(isAllowedPath('packages/core/src/i18n/locales/pt-BR.ts'), true);
  assert.equal(isAllowedPath('packages/core/src/i18n/locales/pt-BR/button.ts'), true);
  assert.equal(isAllowedPath('packages/react/src/button/button.stories.tsx'), false);
});

test('rejects a Portuguese commit message and a tool credited as author', () => {
  assert.equal(messageViolation('fix(select): o rótulo não some'), 'not written in en-US');
  assert.equal(
    messageViolation(
      'fix(select): keep the label\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
    ),
    'credits a tool as author',
  );
  assert.equal(messageViolation('fix(select): keep the label\n\nFixes #12'), null);
});

test('skips the lines between the pt-BR and en-US markers', () => {
  const text = [
    'Isso não conta',
    '// language: pt-BR',
    "expect(label).toBe('Avaliação 4 de 5');",
    '// language: en-US',
    'Mas isso não passa',
  ].join('\n');

  assert.deepEqual(portugueseLines(text), [1, 5]);
});

test('ignores markers inside a commit message', () => {
  assert.equal(messageViolation('language: pt-BR\nfix: o rótulo some'), 'not written in en-US');
});
