export type ComponentEntry = {
  /** The name the package exports, such as `DataTable`. */
  name: string;
  /** The kebab name, the same as the site address `/componentes/<slug>.md`. */
  slug: string;
  /** The catalog family, read from the page frontmatter. */
  family: string;
  /** The first sentence of the page, without markup. */
  summary: string;
  /** The parts that only exist inside this piece, such as `CardHeader` in `Card`. */
  parts: string[];
};

export type Choice = {
  /** The situation, as the choice table writes it. */
  situation: string;
  /** The pieces named in the right-piece column, in the order they appear. */
  pieces: string[];
  /** The why column, raw. */
  why: string;
};

export type ParityRow = {
  /** The middle cell of the parity table, such as `✔ translates` or `✕ does not port`. */
  state: string;
  /** The table note, on one line. */
  note: string;
};

export type NativeProp = { name: string; type: string; required: boolean };

export type Guide = {
  /** The name `get_guide` accepts. */
  slug: string;
  /** The published title. */
  title: string;
  /** One line about the guide. */
  summary: string;
  /** The path inside `files`. */
  path: string;
};

export type Content = {
  /** The versions of both packages whose documentation was bundled. */
  generatedFrom: { web: string; native: string };
  /** Every markdown file the site serves to agents, by path. */
  files: Record<string, string>;
  /** The catalog pieces, without the parts. */
  components: ComponentEntry[];
  /** Each part and the piece that contains it. */
  parts: Record<string, string>;
  /** The "When not to use" section of each piece that has one. */
  avoid: Record<string, string>;
  /** The choice table of `reference/components.md`, row by row. */
  choices: Choice[];
  /** The React Native parity row of each piece. */
  parity: Record<string, ParityRow>;
  /** The header of the native signature table. */
  signatureHeader: string;
  /** The rows of the native signature table, by web piece. */
  signature: Record<string, string[]>;
  /** The props of each piece of the native package. */
  nativeProps: Record<string, { entry: string; props: NativeProp[] }>;
  /** The DTCG files of the house tokens, by name. */
  tokens: Record<string, unknown>;
  /** The guides `get_guide` serves. */
  guides: Guide[];
};
