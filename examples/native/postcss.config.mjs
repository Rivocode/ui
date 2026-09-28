// Without this file Tailwind never runs: the CSS goes raw into the bundle, with
// the theme variables and no utility generated: the screen renders unstyled,
// with no error and no clue, just like forgetting @source on the web.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
