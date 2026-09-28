/**
 * `ToggleGroup` -> `toggle-group`, `OTPField` -> `otp-field`.
 *
 * The address is what the person types, shares and hands to an agent, so it
 * stays lowercase and hyphenated. A run of capitals stays whole: breaking at
 * every capital would turn `OTPField` into `o-t-p-field`.
 *
 * Used by the app and by the Vite plugin that serves the raw markdown, so the
 * page and its `.md` never disagree on the address.
 */
export function slugify(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
