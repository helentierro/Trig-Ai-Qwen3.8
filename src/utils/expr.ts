// src/utils/expr.ts — Parser matemático seguro (Día 1: reemplaza new Function)
// Sin eval(), sin new Function(). Parser recursivo-descendente puro.

const FUNCS: Record<string, (v: number) => number> = {
  sin: (d) => Math.sin((d * Math.PI) / 180),
  cos: (d) => Math.cos((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  asin: (v) => (Math.asin(v) * 180) / Math.PI,
  acos: (v) => (Math.acos(v) * 180) / Math.PI,
  atan: (v) => (Math.atan(v) * 180) / Math.PI,
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  log: Math.log10,
  ln: Math.log,
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

// ─── Tokenizer ─────────────────────────────────────────────────────────────
type Token =
  | { kind: 'num'; v: number }
  | { kind: 'id'; v: string }
  | { kind: 'op'; v: string }
  | { kind: 'lp' }
  | { kind: 'rp' }
  | { kind: 'comma' };

function tokenize(src: string): Token[] | null {
  let s = src.toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/');
  // Soporte de ^ como potencia
  s = s.replace(/\^/g, '**');
  if (!s) return null;
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      let dots = 0;
      while (j < s.length && (/[0-9]/.test(s[j]) || (s[j] === '.' && dots === 0))) {
        if (s[j] === '.') dots++;
        j++;
      }
      const n = parseFloat(s.slice(i, j));
      if (!isFinite(n)) return null;
      tokens.push({ kind: 'num', v: n });
      i = j;
    } else if (/[a-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-z_0-9]/.test(s[j])) j++;
      tokens.push({ kind: 'id', v: s.slice(i, j) });
      i = j;
    } else if (c === '(') { tokens.push({ kind: 'lp' }); i++; }
    else if (c === ')') { tokens.push({ kind: 'rp' }); i++; }
    else if (c === ',') { tokens.push({ kind: 'comma' }); i++; }
    else if ('+-*/%'.includes(c)) { tokens.push({ kind: 'op', v: c }); i++; }
    else if (c === '*' && s[i + 1] === '*') { tokens.push({ kind: 'op', v: '**' }); i += 2; }
    else return null; // carácter inválido
  }
  return tokens;
}

// ─── Parser (precedencia correcta) ────────────────────────────────────────
class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private vars: Record<string, number>,
  ) {}

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  parse(): number | null {
    try {
      const v = this.expr();
      if (this.pos !== this.tokens.length) return null;
      return typeof v === 'number' && isFinite(v) ? v : null;
    } catch {
      return null;
    }
  }

  // expr = term (('+' | '-') term)*
  private expr(): number {
    let left = this.term();
    while (true) {
      const t = this.peek();
      if (t?.kind === 'op' && (t.v === '+' || t.v === '-')) {
        this.consume();
        const right = this.term();
        left = t.v === '+' ? left + right : left - right;
      } else break;
    }
    return left;
  }

  // term = power (('*' | '/' | '%') power)*
  private term(): number {
    let left = this.power();
    while (true) {
      const t = this.peek();
      if (t?.kind === 'op' && (t.v === '*' || t.v === '/' || t.v === '%')) {
        this.consume();
        const right = this.power();
        if (t.v === '*') left = left * right;
        else if (t.v === '/') {
          if (right === 0) throw new Error('div0');
          left = left / right;
        } else left = left % right;
      } else break;
    }
    return left;
  }

  // power = unary ('**' unary)*  (right-associative)
  private power(): number {
    const base = this.unary();
    const t = this.peek();
    if (t?.kind === 'op' && t.v === '**') {
      this.consume();
      const exp = this.power();
      return Math.pow(base, exp);
    }
    return base;
  }

  // unary = ('+' | '-')? atom
  private unary(): number {
    const t = this.peek();
    if (t?.kind === 'op' && (t.v === '+' || t.v === '-')) {
      this.consume();
      const v = this.unary();
      return t.v === '-' ? -v : v;
    }
    return this.atom();
  }

  // atom = num | const | var | id '(' args ')' | '(' expr ')'
  private atom(): number {
    const t = this.consume();
    if (!t) throw new Error('unexpected end');
    if (t.kind === 'num') return t.v;
    if (t.kind === 'lp') {
      const v = this.expr();
      const rp = this.consume();
      if (!rp || rp.kind !== 'rp') throw new Error('missing )');
      return v;
    }
    if (t.kind === 'id') {
      const next = this.peek();
      // Función: id '(' args ')'
      if (next?.kind === 'lp') {
        const fn = FUNCS[t.v];
        if (!fn) throw new Error('unknown fn: ' + t.v);
        this.consume(); // (
        const args: number[] = [];
        if (this.peek()?.kind !== 'rp') {
          args.push(this.expr());
          while (this.peek()?.kind === 'comma') {
            this.consume();
            args.push(this.expr());
          }
        }
        const rp = this.consume();
        if (!rp || rp.kind !== 'rp') throw new Error('missing )');
        if (args.length !== 1) throw new Error('arity');
        return fn(args[0]);
      }
      // Constante
      if (t.v in CONSTS) return CONSTS[t.v];
      // Variable
      if (t.v in this.vars) return this.vars[t.v];
      throw new Error('unknown id: ' + t.v);
    }
    throw new Error('unexpected token');
  }
}

export function evalExpr(src: string, vars: Record<string, number> = {}): number | null {
  if (!src || typeof src !== 'string') return null;
  const tokens = tokenize(src);
  if (!tokens || tokens.length === 0) return null;
  return new Parser(tokens, vars).parse();
}

export const fmtN = (n: number): string => {
  if (Math.abs(n) >= 1_000_000 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(3);
  return String(Number(n.toFixed(4)));
};