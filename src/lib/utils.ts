/**
 * Lightweight classname utility — inspired by clsx and cn helpers.
 *
 * Supports:
 * - Strings: cn('foo', 'bar') → 'foo bar'
 * - Falsy values: cn('foo', false, null, undefined, '') → 'foo'
 * - Objects: cn({ foo: true, bar: false, baz: true }) → 'foo baz'
 * - Arrays: cn(['foo', 'bar'], ['baz']) → 'foo bar baz'
 * - Nesting: cn('base', ['btn', { active: true }]) → 'base btn active'
 * - Mixed: cn('a', false, 'b', { c: true, d: false }, ['e', 'f']) → 'a b c e f'
 */

type ClassnameArg =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassnameArg[]
  | Record<string, boolean | null | undefined>;

function resolveClassnameValue(arg: ClassnameArg): string {
  if (typeof arg === 'string' || typeof arg === 'number') return String(arg);
  if (Array.isArray(arg)) {
    let result = '';
    for (let i = 0; i < arg.length; i++) {
      const resolved = resolveClassnameValue(arg[i]);
      if (resolved) {
        if (result) result += ' ';
        result += resolved;
      }
    }
    return result;
  }
  if (typeof arg === 'object' && arg !== null) {
    let result = '';
    for (const key in arg) {
      if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
        if (result) result += ' ';
        result += key;
      }
    }
    return result;
  }
  return '';
}

export function cn(...args: ClassnameArg[]): string {
  let result = '';
  for (let i = 0; i < args.length; i++) {
    const resolved = resolveClassnameValue(args[i]);
    if (resolved) {
      if (result) result += ' ';
      result += resolved;
    }
  }
  return result;
}
