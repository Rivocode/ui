/**
 * `ToggleGroup` → `toggle-group`, `OTPField` → `otp-field`.
 *
 * The address is what people type, share and hand to an agent, so it stays
 * lowercase and hyphenated. Runs of capitals are kept whole: splitting on
 * every capital would turn `OTPField` into `o-t-p-field`.
 *
 * Shared by the app and by the Vite plugin that serves the raw markdown, so
 * the page and its `.md` can never disagree on the address.
 */
export function slugify(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
