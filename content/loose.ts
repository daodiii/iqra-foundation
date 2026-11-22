/**
 * The shape of a Norwegian copy file with its words let go: every string literal becomes
 * `string`, so the English file (`*.en.ts`) must have the same keys and nesting as the
 * Norwegian one but says its own words. Booleans, numbers and null stay as they are.
 */
export type Loose<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Loose<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Loose<T[K]> }
      : T;
