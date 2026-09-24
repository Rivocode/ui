export type RichTextMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type RichTextJson = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: RichTextJson[];
  marks?: RichTextMark[];
  text?: string;
};

export type RichTextBlock =
  | { kind: "paragraph"; inline: RichTextInline[] }
  | { kind: "heading"; level: 2 | 3; inline: RichTextInline[] }
  | { kind: "bulletList"; items: RichTextBlock[][] }
  | { kind: "orderedList"; start: number; items: RichTextBlock[][] }
  | { kind: "blockquote"; blocks: RichTextBlock[] }
  | { kind: "codeBlock"; text: string }
  | { kind: "horizontalRule" };

export type RichTextStyle = "bold" | "italic" | "underline" | "strike" | "code";

export type RichTextInline =
  | { kind: "text"; text: string; styles: RichTextStyle[]; href?: string }
  | { kind: "hardBreak" };

type Tag = { tag: string; attrs: Record<string, string>; children: Piece[] };
type Piece = Tag | string;

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW = new Set(["script", "style", "textarea", "title", "xmp", "plaintext", "noscript"]);

const DROPPED = new Set([
  "head",
  "template",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "canvas",
  "video",
  "audio",
  "select",
  "button",
  "img",
  "input",
  "meta",
  "link",
  "base",
]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  bull: "•",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  ordm: "º",
  ordf: "ª",
  deg: "°",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  agrave: "à",
  atilde: "ã",
  otilde: "õ",
  acirc: "â",
  ecirc: "ê",
  ocirc: "ô",
  ccedil: "ç",
  uuml: "ü",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Agrave: "À",
  Atilde: "Ã",
  Otilde: "Õ",
  Acirc: "Â",
  Ecirc: "Ê",
  Ocirc: "Ô",
  Ccedil: "Ç",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code =
        name[1] === "x" || name[1] === "X"
          ? Number.parseInt(name.slice(2), 16)
          : Number.parseInt(name.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole;
      if (code >= 0xd800 && code <= 0xdfff) return whole;
      return String.fromCodePoint(code);
    }
    return ENTITIES[name] ?? whole;
  });
}

const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function attributesOf(source: string) {
  const attrs: Record<string, string> = {};
  for (const hit of source.matchAll(ATTRIBUTE)) {
    const name = hit[1]!.toLowerCase();
    if (name in attrs) continue;
    attrs[name] = decodeEntities(hit[2] ?? hit[3] ?? hit[4] ?? "");
  }
  return attrs;
}

const IMPLIED_CLOSE: Record<string, string[]> = {
  p: ["p"],
  li: ["li"],
  h1: ["p"],
  h2: ["p"],
  h3: ["p"],
  h4: ["p"],
  h5: ["p"],
  h6: ["p"],
  ul: ["p"],
  ol: ["p"],
  blockquote: ["p"],
  pre: ["p"],
  hr: ["p"],
  div: ["p"],
};

const MAX_DEPTH = 64;

const CLOSING = /<\/([a-z][a-z0-9:-]*)[^<>]*>/iy;

const OPENING = /<([a-z][a-z0-9:-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/iy;

const RAW_END = new Map([...RAW].map((tag) => [tag, new RegExp(`</${tag}`, "gi")]));

function treeOf(html: string): Piece[] {
  const root: Tag = { tag: "#root", attrs: {}, children: [] };
  const stack: Tag[] = [root];
  const top = () => stack[stack.length - 1]!;
  let at = 0;
  let nextGt = html.indexOf(">");

  const gtFrom = (from: number) => {
    if (nextGt !== -1 && nextGt < from) nextGt = html.indexOf(">", from);
    return nextGt;
  };

  const close = (tag: string) => {
    for (let index = stack.length - 1; index > 0; index -= 1) {
      if (stack[index]!.tag === tag) {
        stack.length = index;
        return;
      }
    }
  };

  while (at < html.length) {
    const open = html.indexOf("<", at);
    if (open === -1) {
      top().children.push(decodeEntities(html.slice(at)));
      break;
    }
    if (open > at) top().children.push(decodeEntities(html.slice(at, open)));

    if (html.startsWith("<!--", open)) {
      const end = html.indexOf("-->", open + 4);
      at = end === -1 ? html.length : end + 3;
      continue;
    }

    CLOSING.lastIndex = open;
    const closing = CLOSING.exec(html);
    if (closing) {
      close(closing[1]!.toLowerCase());
      at = open + closing[0].length;
      continue;
    }

    OPENING.lastIndex = open;
    const opening = OPENING.exec(html);
    if (!opening) {
      const mark = html[open + 1];
      if (mark === "!" || mark === "?") {
        const end = gtFrom(open);
        at = end === -1 ? html.length : end + 1;
        continue;
      }
      top().children.push("<");
      at = open + 1;
      continue;
    }

    const tag = opening[1]!.toLowerCase();
    const body = opening[2] ?? "";
    at = open + opening[0].length;

    const rawEnd = RAW_END.get(tag);
    if (rawEnd) {
      rawEnd.lastIndex = at;
      const end = rawEnd.exec(html);
      if (!end) break;
      const after = gtFrom(end.index);
      at = after === -1 ? html.length : after + 1;
      continue;
    }

    for (const implied of IMPLIED_CLOSE[tag] ?? []) {
      if (top().tag === implied) stack.pop();
    }

    const node: Tag = { tag, attrs: attributesOf(body), children: [] };
    top().children.push(node);
    if (!VOID.has(tag) && !body.trimEnd().endsWith("/") && stack.length <= MAX_DEPTH) {
      stack.push(node);
    }
  }

  return root.children;
}

export function safeHref(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const href = raw.trim();
  if (!href) return undefined;
  const bare = [...href]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join("");
  if (/^\/\/[^/\\]/.test(bare)) return `https:${bare}`;
  if (/^(?:\\|\/\\|\/\/)/.test(bare)) return undefined;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(bare);
  if (!scheme) return /^[/#?.]/.test(bare) || !bare.includes(":") ? href : undefined;
  return ["http", "https", "mailto", "tel"].includes(scheme[1]!.toLowerCase()) ? href : undefined;
}

export function normalizeLinkInput(raw: string): string | undefined {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return safeHref(text);
  if (/^[/\\#?]/.test(text)) return safeHref(text);
  if (/^[^@/]+@[^@/]+\.[^@/]+$/.test(text)) return `mailto:${text}`;
  if (/^[^./][^/]*\.[a-z]{2,}(?:[/:?#]|$)/i.test(text)) return `https://${text}`;
  return undefined;
}

const STYLE_OF: Record<string, RichTextStyle> = {
  strong: "bold",
  b: "bold",
  em: "italic",
  i: "italic",
  u: "underline",
  ins: "underline",
  s: "strike",
  strike: "strike",
  del: "strike",
  code: "code",
  kbd: "code",
  samp: "code",
};

const BLOCK = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "hr",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "aside",
  "nav",
  "figure",
  "figcaption",
  "address",
  "details",
  "summary",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
  "body",
  "html",
]);

type Context = { styles: RichTextStyle[]; href?: string };

function textOf(pieces: Piece[]): string {
  return pieces
    .map((piece) => {
      if (typeof piece === "string") return piece;
      if (DROPPED.has(piece.tag)) return "";
      if (piece.tag === "br") return "\n";
      return textOf(piece.children);
    })
    .join("");
}

function withStyle(context: Context, style: RichTextStyle): Context {
  return context.styles.includes(style)
    ? context
    : { ...context, styles: [...context.styles, style] };
}

function isPlainWeight(attrs: Record<string, string>) {
  return /font-weight\s*:\s*(normal|[1-4]00)\b/i.test(attrs.style ?? "");
}

function inlineOf(pieces: Piece[], context: Context, into: RichTextInline[]) {
  for (const piece of pieces) {
    if (typeof piece === "string") {
      into.push({ kind: "text", text: piece.replace(/[ \t\n\r\f]+/g, " "), ...contextOf(context) });
      continue;
    }
    if (DROPPED.has(piece.tag)) continue;
    if (piece.tag === "br") {
      into.push({ kind: "hardBreak" });
      continue;
    }
    if (piece.tag === "a") {
      const href = safeHref(piece.attrs.href);
      inlineOf(piece.children, href ? { ...context, href } : context, into);
      continue;
    }
    const style = STYLE_OF[piece.tag];
    if (style && !(piece.tag === "b" && isPlainWeight(piece.attrs))) {
      inlineOf(piece.children, withStyle(context, style), into);
      continue;
    }
    inlineOf(piece.children, context, into);
  }
}

function contextOf(context: Context) {
  return context.href
    ? { styles: context.styles, href: context.href }
    : { styles: context.styles };
}

function sameLook(one: RichTextInline, other: RichTextInline) {
  return (
    one.kind === "text" &&
    other.kind === "text" &&
    one.href === other.href &&
    one.styles.length === other.styles.length &&
    one.styles.every((style) => other.styles.includes(style))
  );
}

export function tidyInline(runs: RichTextInline[]): RichTextInline[] {
  const merged: RichTextInline[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.kind === "text" && run.kind === "text" && sameLook(last, run)) {
      merged[merged.length - 1] = { ...last, text: last.text + run.text };
    } else {
      merged.push(run);
    }
  }

  let first = 0;
  while (first < merged.length) {
    const run = merged[first]!;
    if (run.kind !== "text") break;
    const text = run.text.replace(/^[ \t\n\r\f]+/, "");
    if (text) {
      merged[first] = { ...run, text };
      break;
    }
    first += 1;
  }

  let last = merged.length - 1;
  while (last >= first) {
    const run = merged[last]!;
    if (run.kind !== "text") break;
    const text = run.text.replace(/[ \t\n\r\f]+$/, "");
    if (text) {
      merged[last] = { ...run, text };
      break;
    }
    last -= 1;
  }

  return merged.slice(first, last + 1).filter((run) => run.kind !== "text" || run.text !== "");
}

function hasText(runs: RichTextInline[]) {
  return runs.some((run) => run.kind === "hardBreak" || run.text.trim() !== "");
}

function isBlock(piece: Piece) {
  return typeof piece !== "string" && BLOCK.has(piece.tag);
}

function blocksOf(pieces: Piece[], context: Context): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  let pending: Piece[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    const runs: RichTextInline[] = [];
    inlineOf(pending, context, runs);
    pending = [];
    const tidy = tidyInline(runs);
    if (hasText(tidy)) blocks.push({ kind: "paragraph", inline: tidy });
  };

  for (const piece of pieces) {
    if (!isBlock(piece)) {
      pending.push(piece);
      continue;
    }
    flush();
    const tag = (piece as Tag).tag;
    const node = piece as Tag;

    if (tag === "p") {
      const runs: RichTextInline[] = [];
      inlineOf(node.children, context, runs);
      blocks.push({ kind: "paragraph", inline: tidyInline(runs) });
    } else if (tag === "h2" || tag === "h3") {
      const runs: RichTextInline[] = [];
      inlineOf(node.children, context, runs);
      blocks.push({ kind: "heading", level: tag === "h2" ? 2 : 3, inline: tidyInline(runs) });
    } else if (/^h[1-6]$/.test(tag)) {
      const runs: RichTextInline[] = [];
      inlineOf(node.children, context, runs);
      blocks.push({ kind: "paragraph", inline: tidyInline(runs) });
    } else if (tag === "ul" || tag === "ol") {
      const items = node.children
        .filter((child) => typeof child !== "string" || child.trim() !== "")
        .map((child) =>
          typeof child !== "string" && child.tag === "li"
            ? blocksOf(child.children, context)
            : blocksOf([child], context),
        )
        .filter((item) => item.length > 0);
      if (items.length === 0) continue;
      if (tag === "ul") blocks.push({ kind: "bulletList", items });
      else {
        const start = Number.parseInt(node.attrs.start ?? "1", 10);
        blocks.push({ kind: "orderedList", start: Number.isFinite(start) ? start : 1, items });
      }
    } else if (tag === "blockquote") {
      const inner = blocksOf(node.children, context);
      if (inner.length > 0) blocks.push({ kind: "blockquote", blocks: inner });
    } else if (tag === "pre") {
      const text = textOf(node.children).replace(/^\n/, "").replace(/\n$/, "");
      if (text.trim()) blocks.push({ kind: "codeBlock", text });
    } else if (tag === "hr") {
      blocks.push({ kind: "horizontalRule" });
    } else {
      blocks.push(...blocksOf(node.children, context));
    }
  }

  flush();
  return blocks;
}

export function parseRichHtml(html: string): RichTextBlock[] {
  return blocksOf(treeOf(html), { styles: [] });
}

const MARK_STYLE: Record<string, RichTextStyle> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strike: "strike",
  code: "code",
};

function flatText(nodes: RichTextJson[] | undefined): string {
  const pending = Array.isArray(nodes) ? [...nodes].reverse() : [];
  let text = "";
  while (pending.length > 0) {
    const node = pending.pop()!;
    if (typeof node.text === "string") text += node.text;
    else if (node.type === "hardBreak") text += "\n";
    else if (Array.isArray(node.content)) {
      for (let index = node.content.length - 1; index >= 0; index -= 1) {
        pending.push(node.content[index]!);
      }
    }
  }
  return text;
}

function inlineOfJson(nodes: RichTextJson[] | undefined, into: RichTextInline[], depth = 0) {
  if (depth > MAX_DEPTH) {
    const text = flatText(nodes);
    if (text) into.push({ kind: "text", text, styles: [] });
    return;
  }
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      into.push({ kind: "hardBreak" });
      continue;
    }
    if (typeof node.text === "string") {
      const styles: RichTextStyle[] = [];
      let href: string | undefined;
      for (const mark of node.marks ?? []) {
        const style = MARK_STYLE[mark.type];
        if (style && !styles.includes(style)) styles.push(style);
        if (mark.type === "link") href = safeHref(mark.attrs?.href) ?? href;
      }
      into.push(
        href ? { kind: "text", text: node.text, styles, href } : { kind: "text", text: node.text, styles },
      );
      continue;
    }
    inlineOfJson(node.content, into, depth + 1);
  }
}

function blocksOfJson(nodes: RichTextJson[] | undefined, depth = 0): RichTextBlock[] {
  if (depth > MAX_DEPTH) {
    const text = flatText(nodes);
    return text.trim() ? [{ kind: "paragraph", inline: [{ kind: "text", text, styles: [] }] }] : [];
  }
  const blocks: RichTextBlock[] = [];
  let pending: RichTextJson[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    const runs: RichTextInline[] = [];
    inlineOfJson(pending, runs, depth);
    pending = [];
    if (runs.length > 0) blocks.push({ kind: "paragraph", inline: runs });
  };

  for (const node of nodes ?? []) {
    if (node.type === "text" || node.type === "hardBreak" || typeof node.text === "string") {
      pending.push(node);
      continue;
    }
    flush();

    if (node.type === "paragraph") {
      const runs: RichTextInline[] = [];
      inlineOfJson(node.content, runs, depth + 1);
      blocks.push({ kind: "paragraph", inline: runs });
    } else if (node.type === "heading") {
      const runs: RichTextInline[] = [];
      inlineOfJson(node.content, runs, depth + 1);
      const level = Number(node.attrs?.level);
      blocks.push(
        level === 2 || level === 3
          ? { kind: "heading", level, inline: runs }
          : { kind: "paragraph", inline: runs },
      );
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      const items = (node.content ?? []).map((item) =>
        item.type === "listItem"
          ? blocksOfJson(item.content, depth + 1)
          : blocksOfJson([item], depth + 1),
      );
      if (node.type === "bulletList") blocks.push({ kind: "bulletList", items });
      else {
        const start = Number(node.attrs?.start ?? 1);
        blocks.push({ kind: "orderedList", start: Number.isFinite(start) ? start : 1, items });
      }
    } else if (node.type === "blockquote") {
      blocks.push({ kind: "blockquote", blocks: blocksOfJson(node.content, depth + 1) });
    } else if (node.type === "codeBlock") {
      const runs: RichTextInline[] = [];
      inlineOfJson(node.content, runs, depth + 1);
      blocks.push({
        kind: "codeBlock",
        text: runs.map((run) => (run.kind === "text" ? run.text : "\n")).join(""),
      });
    } else if (node.type === "horizontalRule") {
      blocks.push({ kind: "horizontalRule" });
    } else {
      blocks.push(...blocksOfJson(node.content, depth + 1));
    }
  }

  flush();
  return blocks;
}

export function richTextBlocks(value: string | RichTextJson | null | undefined): RichTextBlock[] {
  if (value == null) return [];
  if (typeof value === "string") return parseRichHtml(value);
  return value.type === "doc" || !value.type ? blocksOfJson(value.content) : blocksOfJson([value]);
}

function inlineIsBlank(runs: RichTextInline[]) {
  return runs.every((run) => run.kind === "text" && run.text.trim() === "");
}

export function isRichTextEmpty(blocks: RichTextBlock[]): boolean {
  return blocks.every((block) => {
    if (block.kind === "paragraph" || block.kind === "heading") return inlineIsBlank(block.inline);
    if (block.kind === "codeBlock") return block.text.trim() === "";
    if (block.kind === "horizontalRule") return false;
    if (block.kind === "blockquote") return isRichTextEmpty(block.blocks);
    return block.items.every((item) => isRichTextEmpty(item));
  });
}
