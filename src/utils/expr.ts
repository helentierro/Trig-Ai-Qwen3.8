// src/utils/expr.ts — parser matemático seguro (v2 FINAL)
// Sin eval(), sin new Function(). Parser recursivo-descendente puro.
// Soporta: + - * / % ^ · paréntesis · coma · pi, e · variables
// Funciones 1 arg: sin cos tan asin acos atan sqrt abs round floor ceil log ln
// Funciones N args: min max (la Hoja emite Math.min/Math.max y aquí se entienden)

const FUNCS1_DEG: Record<string, (v: number) => number> = {
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

const FUNCS1_RAD: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  log: Math.log10,
  ln: Math.log,
};

/** Modo angular de la calculadora: grados (aula, defecto) o radianes (nivel GeoGebra). */
export type AngleMode = 'deg' | 'rad';

/** Extrae los números de un texto libre ("(50, 60)" → [50, 60]). Vacío si no hay. */
export const extractNums = (t: string): number[] =>
  (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);

const FUNCSN: Record<string, (vals: number[]) => number> = {
  min: (vals) => Math.min(...vals),
  max: (vals) => Math.max(...vals),
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

type Token =
  | { kind: 'num'; v: number }
  | { kind: 'id'; v: string }
  | { kind: 'op'; v: string }
  | { kind: 'lp' }
  | { kind: 'rp' }
  | { kind: 'comma' };

function tokenize(src: string): Token[] | null {
  const s = src
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/math\.min/g, 'min')
    .replace(/math\.max/g, 'max')
    .replace(/\^/g, '**');
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
    else if (c === '*' && s[i + 1] === '*') { tokens.push({ kind: 'op', v: '**' }); i += 2; }
    else if ('+-*/%'.includes(c)) { tokens.push({ kind: 'op', v: c }); i++; }
    else return null; // carácter desconocido → rechazo seguro
  }
  return tokens;
}

class Parser {
  private pos = 0;
  private tokens: Token[];
  private vars: Record<string, number>;
  private funcs1: Record<string, (v: number) => number>;
  constructor(tokens: Token[], vars: Record<string, number>, angle: AngleMode = 'deg') {
    this.tokens = tokens;
    this.vars = vars;
    this.funcs1 = angle === 'rad' ? FUNCS1_RAD : FUNCS1_DEG;
  }
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
    for (;;) {
      const t = this.peek();
      if (t && t.kind === 'op' && (t.v === '+' || t.v === '-')) {
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
    for (;;) {
      const t = this.peek();
      if (t && t.kind === 'op' && (t.v === '*' || t.v === '/' || t.v === '%')) {
        this.consume();
        const right = this.power();
        if (t.v === '*') left = left * right;
        else if (t.v === '/') {
          if (right === 0) throw new Error('div0'); // división por cero → null seguro
          left = left / right;
        } else left = left % right;
      } else break;
    }
    return left;
  }

  // power = unary ('**' unary)*  (asociativo a la derecha)
  private power(): number {
    const base = this.unary();
    const t = this.peek();
    if (t && t.kind === 'op' && t.v === '**') {
      this.consume();
      return Math.pow(base, this.power());
    }
    return base;
  }

  // unary = ('+' | '-')? atom
  private unary(): number {
    const t = this.peek();
    if (t && t.kind === 'op' && (t.v === '+' || t.v === '-')) {
      this.consume();
      const v = this.unary();
      return t.v === '-' ? -v : v;
    }
    return this.atom();
  }

  // atom = num | const | var | id(args) | '(' expr ')'
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
      if (next && next.kind === 'lp') {
        this.consume(); // '('
        const args: number[] = [];
        if (this.peek() && this.peek()!.kind !== 'rp') {
          args.push(this.expr());
          while (this.peek() && this.peek()!.kind === 'comma') {
            this.consume();
            args.push(this.expr());
          }
        }
        const rp = this.consume();
        if (!rp || rp.kind !== 'rp') throw new Error('missing )');
        const f1 = this.funcs1[t.v];
        if (f1) {
          if (args.length !== 1) throw new Error('arity');
          return f1(args[0]);
        }
        const fn = FUNCSN[t.v];
        if (fn) {
          if (args.length < 1) throw new Error('arity');
          return fn(args);
        }
        throw new Error('unknown fn: ' + t.v);
      }
      if (t.v in CONSTS) return CONSTS[t.v];
      if (t.v in this.vars) return this.vars[t.v];
      throw new Error('unknown id: ' + t.v);
    }
    throw new Error('unexpected token');
  }
}

export function evalExpr(src: string, vars: Record<string, number> = {}, opts: { angle?: AngleMode } = {}): number | null {
  if (!src || typeof src !== 'string') return null;
  const tokens = tokenize(src);
  if (!tokens || tokens.length === 0) return null;
  return new Parser(tokens, vars, opts.angle ?? 'deg').parse();
}

export const fmtN = (n: number): string => {
  if (Math.abs(n) >= 1_000_000 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(3);
  return String(Number(n.toFixed(4)));
};