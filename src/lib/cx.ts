type ClassValue = string | false | null | undefined;

/**
 * Tiny class-name joiner. Falsy values are dropped so callers can write
 * `cx(base, isActive && "active")` without producing `"false"` in the output.
 */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}