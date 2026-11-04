/**
 * A deliberately small Java tokenizer for the code sheets on the Sleeper tab. Runs at
 * build time and returns escaped HTML with span classes: tk-k keyword, tk-t type,
 * tk-f method, tk-s string, tk-p README placeholder, tk-c comment, tk-n number.
 */
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const KEYWORDS = /^(?:new|class|extends|implements|public|private|protected|static|final|throws|throw|return|import|package|interface|void|int|long|boolean|this|try|catch)$/;

type Kind = 'c' | 's' | 'p' | 'f' | 'i' | 'n' | null;
const RULES: Array<[RegExp, Kind]> = [
  [/\/\/[^\n]*/y, 'c'],
  [/"(?:[^"\\\n]|\\.)*"/y, 's'],
  [/\{[A-Za-z_][A-Za-z0-9_]*\}/y, 'p'],
  [/[A-Za-z_][A-Za-z0-9_]*(?=\s*\()/y, 'f'],
  [/[A-Za-z_][A-Za-z0-9_]*/y, 'i'],
  [/\d+/y, 'n'],
  [/\s+/y, null],
  [/[\s\S]/y, null],
];

export function java(code: string): string {
  let out = '';
  let i = 0;
  while (i < code.length) {
    for (const [re, kind] of RULES) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m) continue;
      const tok = m[0];
      i += tok.length;
      let k: string | null = kind;
      if (k === 'i' || k === 'f') k = KEYWORDS.test(tok) ? 'k' : /^[A-Z]/.test(tok) ? 't' : k === 'f' ? 'f' : null;
      out += k ? `<span class="tk-${k}">${esc(tok)}</span>` : esc(tok);
      break;
    }
  }
  return out;
}

export { esc as escapeHtml };
