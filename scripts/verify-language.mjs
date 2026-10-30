import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * The language gate: every tracked file and every commit message on the branch
 * is written in en-US. Locale data is the only place for another
 * language; ALLOWED_PATHS lists those files.
 *
 *   node scripts/verify-language.mjs
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWED_PATHS = [
  /^packages\/core\/src\/i18n\/locales\/pt-BR(\.ts$|\/)/,
  // The Nexora seed data has a Brazil region with Brazilian names and cities.
  /^demos\/nexora\/backend\/backend\/data\/vocabulary-br\.ts$/,
  // The gate itself: its word list and its fixtures.
  /^scripts\/verify-language(\.test)?\.mjs$/,
];

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|gz|tgz|mp4|webm)$/i;

// Unaccented Portuguese words that English text never uses: one of them flags its line.
const STRONG_WORDS = new Set(
  'abaixo abrir acima adicionar aguarda ainda amanha aprovada aprovado armazem atrasada atrasado baixar bloqueada bloqueado cancelada cancelado carregar cliente clientes cobranca compras concluida concluido configuracoes contato contatos editar empresa empresas endereco entao entrega entregas entregue entregues enviada enviado enviar essa esse estoque excluir fatura faturas fechar filiais filial fornecedor fornecedores hoje inicio isso nao nenhum nenhuma obrigatorio ontem opcional pagamento pagamentos painel pedido pedidos pendente pendentes pesquisar proxima proximo rascunho recebida recebido recebimento registrada registradas registrado registrados relatorio relatorios salvar selecionar semana semanas tambem telefone usuario usuarios vencida vencido vendas voce voltar'.split(
    ' ',
  ),
);

// Unaccented Portuguese words that can collide with English or a name: a line needs two.
const WORDS = new Set(
  'aberta aberto ano anos apos aqui ate cada coluna colunas com conta contas deve devem depois dia dias dela dele entre esta este fechada fechado fiscal lista linha linhas mais menos mes meses mesma mesmo muito nome nota notas nova novas novo novos num numa onde outra outras outro outros para pela pelas pelo pelos pode podem por porque primeira primeiro produto produtos quando remover sem sempre seu sobre sua tabela todas todos uma umas valor'.split(
    ' ',
  ),
);

// One word that carries a Portuguese diacritic is enough to flag its line.
const DIACRITIC = /[ãõçâêôàáéíóú]/iu;

// Words with those diacritics that en-US text uses: loanwords, and names and words of
// other languages in collation and accent-folding fixtures.
const ALLOWED_WORDS = new Set([
  'andré',
  'bézier',
  'café',
  'cafés',
  'cerámica',
  'cádiz',
  'côte',
  'documentación',
  'début',
  'façade',
  'fernández',
  'gràcia',
  'kraków',
  'lucía',
  'montréal',
  'méxico',
  'mól',
  'plików',
  'querétaro',
  'resumé',
  'resumés',
  'reykjavík',
  'résumé',
  'résumés',
  'tomás',
  'álvaro',
  'échap',
  'été',
]);

// Proper names and language endonyms that en-US text writes as they are spelled.
const ALLOWED_PHRASES = ['São Paulo', 'Português (Brasil)'];

const URL = /\bhttps?:\/\/\S+/g;

const MARKER_START = /\blanguage: pt-BR\b/;
const MARKER_END = /\blanguage: en-US\b/;

const AI_TRAILER =
  /^(co-authored-by:.*(claude|anthropic|openai|codex|copilot)|.*generated with \[?claude)/im;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = [...fileViolations(), ...commitViolations()];

  for (const failure of failures) console.error(failure);

  if (failures.length > 0) {
    console.error(`\n${failures.length} line(s) not written in en-US.`);
    process.exit(1);
  }

  console.log('language: every tracked file and branch commit is en-US');
}

/**
 * The 1-based numbers of the lines of `text` that read as Portuguese. Lines
 * from a `language: pt-BR` marker to a `language: en-US` marker are pt-BR on
 * purpose (locale output under test) and are skipped, the markers included.
 */
export function portugueseLines(text) {
  let marked = false;

  return text.split('\n').flatMap((line, index) => {
    if (MARKER_START.test(line)) marked = true;

    const skipped = marked;

    if (MARKER_END.test(line)) marked = false;

    return !skipped && isPortuguese(line) ? [index + 1] : [];
  });
}

export function isPortuguese(line) {
  const text = ALLOWED_PHRASES.reduce((rest, phrase) => rest.replaceAll(phrase, ''), line);
  const words =
    text
      .replace(URL, '')
      .toLowerCase()
      .match(/\p{L}+/gu) ?? [];
  const accented = words.filter((word) => word.length > 1 && DIACRITIC.test(word));

  if (accented.some((word) => !ALLOWED_WORDS.has(word))) return true;

  if (words.some((word) => STRONG_WORDS.has(word))) return true;

  return new Set(words.filter((word) => WORDS.has(word))).size >= 2;
}

export function isAllowedPath(path) {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

/** A commit message that is Portuguese or credits a tool as its author. */
export function messageViolation(message) {
  if (AI_TRAILER.test(message)) return 'credits a tool as author';

  if (message.split('\n').some(isPortuguese)) return 'not written in en-US';

  return null;
}

function fileViolations() {
  const paths = git(['ls-files', '-z']).split('\0').filter(Boolean);

  return paths
    .filter((path) => !BINARY.test(path) && !isAllowedPath(path))
    .flatMap((path) => {
      const text = readTracked(path);

      return text === null ? [] : portugueseLines(text).map((line) => `${path}:${line}`);
    });
}

function commitViolations() {
  const base = git(['merge-base', 'origin/main', 'HEAD'], { optional: true });

  if (base === '') return [];

  const log = git(['log', '-z', '--format=%h%n%B', `${base}..HEAD`]);

  return log
    .split('\0')
    .filter(Boolean)
    .flatMap((entry) => {
      const [hash, ...body] = entry.split('\n');
      const violation = messageViolation(body.join('\n'));

      return violation === null ? [] : [`commit ${hash}: ${violation}`];
    });
}

function readTracked(path) {
  try {
    const text = readFileSync(join(ROOT, path), 'utf8');

    return text.includes('\0') ? null : text;
  } catch {
    // A path deleted in the working tree but still in the index.
    return null;
  }
}

function git(args, { optional = false } = {}) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    if (optional) return '';

    throw error;
  }
}
