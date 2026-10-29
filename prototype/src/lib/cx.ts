/** Join class names, skipping falsy values. */
export const cx = (...a: (string | false | null | undefined)[]): string => a.filter(Boolean).join(' ')
