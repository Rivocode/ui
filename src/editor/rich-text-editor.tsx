"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Placeholder } from "@tiptap/extensions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  EditorContent,
  Extension,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type FormEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { Button } from "../components/button";
import { Field, FieldError, FieldLabel, Input } from "../components/field";
import { Kbd } from "../components/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { Toggle, ToggleGroup } from "../components/toggle";
import { ToolbarButton, ToolbarRoot, ToolbarSeparator } from "../components/toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { normalizeLinkInput, safeHref, type RichTextJson } from "../shared/rich-text";
import { RICH_TEXT_CONTENT } from "./content";
import { RichTextView } from "./rich-text-view";

export type RichTextEditorLabels = {
  toolbar: string;
  marks: string;
  headings: string;
  lists: string;
  blocks: string;
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;
  heading2: string;
  heading3: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  codeBlock: string;
  link: string;
  undo: string;
  redo: string;
  clear: string;
  linkUrl: string;
  linkApply: string;
  linkRemove: string;
  linkInvalid: string;
  count: (count: number, max: number) => string;
  limit: (max: number) => string;
};

const LABELS: RichTextEditorLabels = {
  toolbar: "Formatação",
  marks: "Estilo do texto",
  headings: "Títulos",
  lists: "Listas",
  blocks: "Blocos",
  bold: "Negrito",
  italic: "Itálico",
  underline: "Sublinhado",
  strike: "Tachado",
  code: "Código",
  heading2: "Título",
  heading3: "Subtítulo",
  bulletList: "Lista com marcadores",
  orderedList: "Lista numerada",
  blockquote: "Citação",
  codeBlock: "Bloco de código",
  link: "Link",
  undo: "Desfazer",
  redo: "Refazer",
  clear: "Limpar formatação",
  linkUrl: "Endereço do link",
  linkApply: "Aplicar",
  linkRemove: "Remover link",
  linkInvalid: "Use um endereço http, https, mailto ou tel.",
  count: (count, max) => `${count} de ${max} caracteres`,
  limit: (max) => `Limite de ${max} caracteres atingido.`,
};

type Labels = RichTextEditorLabels;

type Action =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock";

const KEYS: Record<Action | "link" | "undo" | "redo" | "clear", string> = {
  bold: "mod+b",
  italic: "mod+i",
  underline: "mod+u",
  strike: "mod+shift+s",
  code: "mod+e",
  heading2: "mod+alt+2",
  heading3: "mod+alt+3",
  bulletList: "mod+shift+8",
  orderedList: "mod+shift+7",
  blockquote: "mod+shift+b",
  codeBlock: "mod+alt+c",
  link: "mod+k",
  undo: "mod+z",
  redo: "mod+shift+z",
  clear: "mod+\\",
};

const ICONS: Record<Action, ReactElement> = {
  bold: <Bold />,
  italic: <Italic />,
  underline: <Underline />,
  strike: <Strikethrough />,
  code: <Code />,
  heading2: <Heading2 />,
  heading3: <Heading3 />,
  bulletList: <List />,
  orderedList: <ListOrdered />,
  blockquote: <Quote />,
  codeBlock: <SquareCode />,
};

const RUN: Record<Action, (editor: Editor) => void> = {
  bold: (editor) => editor.chain().focus().toggleBold().run(),
  italic: (editor) => editor.chain().focus().toggleItalic().run(),
  underline: (editor) => editor.chain().focus().toggleUnderline().run(),
  strike: (editor) => editor.chain().focus().toggleStrike().run(),
  code: (editor) => editor.chain().focus().toggleCode().run(),
  heading2: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  heading3: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  bulletList: (editor) => editor.chain().focus().toggleBulletList().run(),
  orderedList: (editor) => editor.chain().focus().toggleOrderedList().run(),
  blockquote: (editor) => editor.chain().focus().toggleBlockquote().run(),
  codeBlock: (editor) => editor.chain().focus().toggleCodeBlock().run(),
};

const ACTIVE: Record<Action, (editor: Editor) => boolean> = {
  bold: (editor) => editor.isActive("bold"),
  italic: (editor) => editor.isActive("italic"),
  underline: (editor) => editor.isActive("underline"),
  strike: (editor) => editor.isActive("strike"),
  code: (editor) => editor.isActive("code"),
  heading2: (editor) => editor.isActive("heading", { level: 2 }),
  heading3: (editor) => editor.isActive("heading", { level: 3 }),
  bulletList: (editor) => editor.isActive("bulletList"),
  orderedList: (editor) => editor.isActive("orderedList"),
  blockquote: (editor) => editor.isActive("blockquote"),
  codeBlock: (editor) => editor.isActive("codeBlock"),
};

const GROUPS: { name: "marks" | "headings" | "lists" | "blocks"; multiple: boolean; items: Action[] }[] =
  [
    { name: "marks", multiple: true, items: ["bold", "italic", "underline", "strike", "code"] },
    { name: "headings", multiple: false, items: ["heading2", "heading3"] },
    { name: "lists", multiple: false, items: ["bulletList", "orderedList"] },
    { name: "blocks", multiple: true, items: ["blockquote", "codeBlock"] },
  ];

const SPOKEN: Record<string, string> = { shift: "Shift", alt: "Alt" };

function ariaKeys(keys: string) {
  const parts = keys.split("+");
  const spell = (mod: string) =>
    parts
      .map((part) =>
        part === "mod" ? mod : (SPOKEN[part] ?? (part.length === 1 ? part.toUpperCase() : part)),
      )
      .join("+");
  return `${spell("Control")} ${spell("Meta")}`;
}

const LIMIT = new PluginKey("rivoLimit");
const BYPASS = "rivoBypassLimit";

function lengthOf(editor: Editor) {
  return editor.state.doc.textContent.length;
}

function snapshotOf(editor: Editor) {
  const active = {} as Record<Action, boolean>;
  for (const action of Object.keys(ACTIVE) as Action[]) active[action] = ACTIVE[action](editor);
  return {
    active,
    link: editor.isActive("link"),
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    count: lengthOf(editor),
  };
}

function htmlOf(editor: Editor) {
  return editor.isEmpty ? "" : editor.getHTML();
}

type Latest = {
  maxLength?: number;
  onValueChange?: (value: string) => void;
  onJsonChange?: (value: RichTextJson) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  change: (html: string) => void;
  openLink: () => void;
  clear: () => void;
};

export type RichTextEditorProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange" | "onFocus" | "onBlur" | "children" | "placeholder" | "dir"
> & {
  /**
   * O conteudo, em HTML, quando quem usa guarda o texto. E o mesmo formato que
   * o `onValueChange` devolve, e o que o `RichTextView` exibe. Trocar o valor
   * por fora substitui o documento sem disparar `onValueChange`.
   */
  value?: string;
  /** O HTML do primeiro desenho, quando a peca guarda o proprio texto. */
  defaultValue?: string;
  /**
   * Avisado a cada mudanca, com o documento inteiro em HTML. O editor em
   * branco entrega string vazia, e nao `<p></p>`: e o que deixa `z.string().min(1)`
   * recusar o campo vazio.
   */
  onValueChange?: (value: string) => void;
  /**
   * Avisado a cada mudanca com o documento em JSON, o formato do Tiptap. Guarde
   * este quando o texto for exibido no servidor ou no celular: o
   * `RichTextView` le os dois formatos.
   */
  onJsonChange?: (value: RichTextJson) => void;
  /** Chamado quando o texto ganha foco. */
  onFocus?: () => void;
  /** Chamado quando o texto perde foco; e o que marca o campo como tocado no formulario. */
  onBlur?: () => void;
  /** O texto que aparece no editor vazio. Nao substitui o rotulo: use `FieldLabel` ou `aria-label`. */
  placeholder?: string;
  /**
   * So leitura: o texto pode ser selecionado e copiado, e a barra de
   * ferramentas some. Para exibir o que foi salvo fora de um formulario, o
   * `RichTextView` e mais leve.
   */
  readOnly?: boolean;
  /** Trava o texto e a barra. Dentro de um `Field` desabilitado, trava sozinho. */
  disabled?: boolean;
  /**
   * Pinta a moldura de perigo e anuncia `aria-invalid`. Dentro de um `Field`
   * com `invalid`, ou de um `FormField` com erro, liga sozinho.
   */
  invalid?: boolean;
  /**
   * O teto de caracteres de texto, sem contar as marcas do HTML. Liga o
   * contador no rodape, e o editor recusa a digitacao e a colagem que passam
   * dele. Conteudo salvo maior que o teto abre inteiro, e so aceita apagar.
   */
  maxLength?: number;
  /** O nome do campo no envio do formulario: o HTML sai num `input` escondido. */
  name?: string;
  /**
   * Os textos da barra, do painel de link e do contador, em portugues por
   * padrao. Passe so os que mudam: `{ bold: "Bold", count: (n, max) => ... }`.
   * `count` e o que o leitor de tela ouve sobre o contador, e `limit` o aviso
   * ao bater no teto.
   */
  labels?: Partial<Labels>;
  /** Classe por parte: `toolbar`, `content`, `footer`, `count`. */
  classNames?: Slots<"toolbar" | "content" | "footer" | "count">;
  ref?: Ref<HTMLDivElement>;
};

export function RichTextEditor({
  value,
  defaultValue,
  onValueChange,
  onJsonChange,
  onFocus,
  onBlur,
  placeholder,
  readOnly = false,
  disabled: disabledProp = false,
  invalid: invalidProp = false,
  maxLength,
  name,
  labels: labelsProp,
  className,
  classNames,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: RichTextEditorProps) {
  const labels = { ...LABELS, ...labelsProp };
  const controlled = value !== undefined;
  const [own, setOwn] = useState(defaultValue ?? "");
  const html = controlled ? value : own;
  const [linkOpen, setLinkOpen] = useState(false);

  const latestPlaceholder = useRef(placeholder);
  const latest = useRef<Latest>({
    change: () => {},
    openLink: () => {},
    clear: () => {},
  });

  const editor = useEditor({
    immediatelyRender: false,
    content: html || "",
    editable: !readOnly && !disabledProp,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url, context) =>
            context.defaultValidate(url) && safeHref(url) !== undefined,
        },
      }),
      Placeholder.configure({ placeholder: () => latestPlaceholder.current ?? "" }),
      Extension.create({
        name: "rivoEditor",
        addKeyboardShortcuts() {
          return {
            "Mod-k": () => {
              latest.current.openLink();
              return true;
            },
            "Mod-\\": () => {
              latest.current.clear();
              return true;
            },
          };
        },
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: LIMIT,
              filterTransaction(transaction, state) {
                const max = latest.current.maxLength;
                if (max === undefined || !transaction.docChanged) return true;
                if (transaction.getMeta(BYPASS)) return true;
                const next = transaction.doc.textContent.length;
                return next <= max || next <= state.doc.textContent.length;
              },
            }),
          ];
        },
      }),
    ],
    onUpdate: ({ editor: current }) => {
      const next = htmlOf(current);
      latest.current.change(next);
      latest.current.onValueChange?.(next);
      latest.current.onJsonChange?.(current.getJSON() as JSONContent as RichTextJson);
    },
    onFocus: () => latest.current.onFocus?.(),
    onBlur: () => latest.current.onBlur?.(),
  });

  useEffect(() => {
    latestPlaceholder.current = placeholder;
    latest.current.maxLength = maxLength;
    latest.current.onValueChange = onValueChange;
    latest.current.onJsonChange = onJsonChange;
    latest.current.change = (next) => {
      if (!controlled) setOwn(next);
    };
  });

  useEffect(() => {
    if (!editor || !controlled) return;
    if (htmlOf(editor) === value) return;
    editor
      .chain()
      .setMeta(BYPASS, true)
      .setContent(value || "", { emitUpdate: false })
      .run();
  }, [editor, controlled, value]);

  return (
    <BaseField.Control
      id={id}
      name={name}
      disabled={disabledProp}
      value={html}
      render={(fieldProps, fieldState) => (
        <Surface
          {...props}
          editor={editor}
          html={html}
          fieldProps={fieldProps as FieldProps}
          invalid={invalidProp || fieldState.valid === false}
          readOnly={readOnly}
          placeholder={placeholder}
          maxLength={maxLength}
          labels={labels}
          className={className}
          classNames={classNames}
          ariaLabel={ariaLabel}
          ariaLabelledBy={ariaLabelledBy}
          ariaDescribedBy={ariaDescribedBy}
          latest={latest}
          onFocus={onFocus}
          onBlur={onBlur}
          linkOpen={linkOpen}
          setLinkOpen={setLinkOpen}
        />
      )}
    />
  );
}

type FieldProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  ref?: Ref<HTMLInputElement>;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
};

type SurfaceProps = Omit<ComponentPropsWithoutRef<"div">, "onFocus" | "onBlur"> & {
  editor: Editor | null;
  html: string;
  fieldProps: FieldProps;
  invalid: boolean;
  readOnly: boolean;
  placeholder?: string;
  maxLength?: number;
  labels: Labels;
  classNames?: Slots<"toolbar" | "content" | "footer" | "count">;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  latest: { current: Latest };
  onFocus?: () => void;
  onBlur?: () => void;
  linkOpen: boolean;
  setLinkOpen: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;
};

function Surface({
  editor,
  html,
  fieldProps,
  invalid,
  readOnly,
  placeholder,
  maxLength,
  labels,
  className,
  classNames,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  latest,
  onFocus,
  onBlur,
  linkOpen,
  setLinkOpen,
  ...props
}: SurfaceProps) {
  const hidden = useRef<HTMLInputElement>(null);
  const countId = useId();
  const disabled = Boolean(fieldProps.disabled);
  const textId = fieldProps.id;

  const watched = useEditorState({
    editor,
    selector: ({ editor: current }) => (current ? snapshotOf(current) : null),
  });
  const state = watched ?? (editor ? snapshotOf(editor) : null);

  const count = state?.count ?? 0;
  const atLimit = maxLength !== undefined && count >= maxLength;

  const describedBy =
    [ariaDescribedBy, fieldProps["aria-describedby"], maxLength !== undefined ? countId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  const attributes: Record<string, string> = {
    role: "textbox",
    "aria-multiline": "true",
    class: cn(
      RICH_TEXT_CONTENT,
      "min-h-[calc(var(--rc-control-md)*3)] px-[var(--rc-control-pad-md)] py-2",
      "focus-visible:outline-none",
      "[&_.is-editor-empty:first-child]:before:pointer-events-none",
      "[&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0",
      "[&_.is-editor-empty:first-child]:before:text-fg-subtle",
      "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
      disabled && "cursor-not-allowed [&_*]:text-fg-disabled! text-fg-disabled",
      classNames?.content,
    ),
  };
  if (textId) attributes.id = textId;
  if (ariaLabel) attributes["aria-label"] = ariaLabel;
  const labelledBy = ariaLabelledBy ?? fieldProps["aria-labelledby"];
  if (labelledBy) attributes["aria-labelledby"] = labelledBy;
  if (describedBy) attributes["aria-describedby"] = describedBy;
  if (invalid && !disabled) attributes["aria-invalid"] = "true";
  if (readOnly) attributes["aria-readonly"] = "true";
  if (disabled) attributes["aria-disabled"] = "true";
  if (placeholder) attributes["aria-placeholder"] = placeholder;
  const signature = JSON.stringify(attributes);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setOptions({
      editorProps: { ...editor.options.editorProps, attributes: JSON.parse(signature) },
    });
  }, [editor, signature]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!readOnly && !disabled, false);
  }, [editor, readOnly, disabled]);

  useEffect(() => {
    latest.current.onFocus = () => {
      onFocus?.();
      fieldProps.onFocus?.({ currentTarget: hidden.current } as FocusEvent<HTMLInputElement>);
    };
    latest.current.onBlur = () => {
      onBlur?.();
      fieldProps.onBlur?.({ currentTarget: hidden.current } as FocusEvent<HTMLInputElement>);
    };
    latest.current.openLink = () => {
      if (!readOnly && !disabled) setLinkOpen(true);
    };
    latest.current.clear = () => {
      editor?.chain().focus().unsetAllMarks().clearNodes().run();
    };
  });

  useEffect(() => {
    if (!textId || !editor) return;
    const labels = Array.from(
      document.querySelectorAll<HTMLLabelElement>(`label[for="${CSS.escape(textId)}"]`),
    );
    const focus = () => editor.commands.focus();
    for (const label of labels) label.addEventListener("click", focus);
    return () => {
      for (const label of labels) label.removeEventListener("click", focus);
    };
  }, [textId, editor]);

  function toggled(previous: string[], next: string[]) {
    return (
      next.find((item) => !previous.includes(item)) ??
      previous.find((item) => !next.includes(item))
    );
  }

  const toolbarDisabled = disabled || !editor;

  return (
    <div
      {...props}
      data-invalid={(invalid && !disabled) || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      className={cn(
        "flex w-full flex-col rounded-md border border-border-strong bg-surface font-sans text-fg",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "has-[.ProseMirror-focused]:ring-2 has-[.ProseMirror-focused]:ring-ring",
        "has-[.ProseMirror-focused]:ring-offset-2 has-[.ProseMirror-focused]:ring-offset-bg",
        "data-[invalid]:border-danger",
        "data-[disabled]:cursor-not-allowed data-[disabled]:border-border-disabled",
        "data-[disabled]:bg-surface-raised data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      <input
        ref={fieldProps.ref}
        type="hidden"
        name={fieldProps.name}
        value={html}
        disabled={disabled}
      />

      {!readOnly && (
        <ToolbarRoot
          aria-label={labels.toolbar}
          aria-controls={textId}
          disabled={toolbarDisabled}
          className={cn(
            "flex-wrap rounded-none rounded-t-md border-0 border-b border-border bg-transparent",
            classNames?.toolbar,
          )}
        >
          {GROUPS.map((group, index) => {
            const pressed = group.items.filter((action) => state?.active[action]);
            return (
              <GroupWithSeparator key={group.name} first={index === 0}>
                <ToggleGroup
                  aria-label={labels[group.name]}
                  multiple={group.multiple}
                  value={pressed}
                  onValueChange={(next: string[]) => {
                    const action = toggled(pressed, next) as Action | undefined;
                    if (action && editor) RUN[action](editor);
                  }}
                  disabled={toolbarDisabled}
                  className="gap-0.5 border-0 bg-transparent p-0"
                >
                  {group.items.map((action) => (
                    <Tool
                      key={action}
                      label={labels[action]}
                      keys={KEYS[action]}
                      render={<Toggle value={action} />}
                    >
                      {ICONS[action]}
                    </Tool>
                  ))}
                </ToggleGroup>
              </GroupWithSeparator>
            );
          })}

          <ToolbarSeparator />

          <LinkTool
            editor={editor}
            labels={labels}
            active={Boolean(state?.link)}
            open={linkOpen}
            onOpenChange={setLinkOpen}
            disabled={toolbarDisabled}
          />

          <ToolbarSeparator />

          <Tool
            label={labels.undo}
            keys={KEYS.undo}
            disabled={toolbarDisabled || !state?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 />
          </Tool>
          <Tool
            label={labels.redo}
            keys={KEYS.redo}
            disabled={toolbarDisabled || !state?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 />
          </Tool>
          <Tool
            label={labels.clear}
            keys={KEYS.clear}
            disabled={toolbarDisabled}
            onClick={() => latest.current.clear()}
          >
            <RemoveFormatting />
          </Tool>
        </ToolbarRoot>
      )}

      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <RichTextView
          value={html}
          empty={
            placeholder ? <p className="text-fg-subtle">{placeholder}</p> : <p aria-hidden="true" />
          }
          className={cn(
            "min-h-[calc(var(--rc-control-md)*3)] px-[var(--rc-control-pad-md)] py-2",
            classNames?.content,
          )}
        />
      )}

      {maxLength !== undefined && (
        <div
          className={cn(
            "flex justify-end px-[var(--rc-control-pad-md)] pb-1.5",
            classNames?.footer,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "font-mono text-xs tabular-nums",
              atLimit ? "text-danger-text" : "text-fg-subtle",
              classNames?.count,
            )}
          >
            {`${count}/${maxLength}`}
          </span>
          <span id={countId} className="sr-only">
            {labels.count(count, maxLength)}
          </span>
          <span role="status" className="sr-only">
            {atLimit ? labels.limit(maxLength) : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function GroupWithSeparator({ first, children }: { first: boolean; children: ReactNode }) {
  return (
    <>
      {!first && <ToolbarSeparator />}
      {children}
    </>
  );
}

type ToolProps = ComponentProps<typeof ToolbarButton> & {
  label: string;
  keys: string;
};

function Tool({ label, keys, children, className, ...props }: ToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarButton
            {...props}
            aria-label={label}
            aria-keyshortcuts={ariaKeys(keys)}
            className={cn("[&_svg]:size-4 [&_svg]:shrink-0", className)}
          >
            <span aria-hidden="true" className="contents">
              {children}
            </span>
          </ToolbarButton>
        }
      />
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        <Kbd keys={keys} size="sm" />
      </TooltipContent>
    </Tooltip>
  );
}

type LinkToolProps = {
  editor: Editor | null;
  labels: Labels;
  active: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
};

function LinkTool({ editor, labels, active, open, onOpenChange, disabled }: LinkToolProps) {
  const [draft, setDraft] = useState("");
  const [wrong, setWrong] = useState(false);
  const applied = useRef(false);

  useEffect(() => {
    if (!open || !editor) return;
    applied.current = false;
    setWrong(false);
    setDraft(String(editor.getAttributes("link").href ?? ""));
  }, [open, editor]);

  function finish() {
    applied.current = true;
    onOpenChange(false);
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!editor) return;
    const href = normalizeLinkInput(draft);
    if (!href) {
      setWrong(true);
      return;
    }
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain
        .insertContent({ type: "text", text: draft.trim(), marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      chain.extendMarkRange("link").setLink({ href }).run();
    }
    finish();
  }

  function remove() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    finish();
  }

  return (
    <Popover open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Tool
        label={labels.link}
        keys={KEYS.link}
        disabled={disabled}
        data-pressed={active ? "" : undefined}
        render={<PopoverTrigger />}
      >
        <LinkIcon />
      </Tool>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-80"
        finalFocus={() => (applied.current && editor ? editor.view.dom : true)}
      >
        <form onSubmit={apply} className="flex flex-col gap-3">
          <Field invalid={wrong}>
            <FieldLabel>{labels.linkUrl}</FieldLabel>
            <Input
              size="sm"
              value={draft}
              inputMode="url"
              autoComplete="url"
              placeholder="https://"
              onValueChange={(next) => {
                setDraft(next);
                setWrong(false);
              }}
            />
            {wrong && <FieldError match>{labels.linkInvalid}</FieldError>}
          </Field>
          <div className="flex justify-end gap-2">
            {active && (
              <Button type="button" variant="ghost" size="sm" onClick={remove}>
                {labels.linkRemove}
              </Button>
            )}
            <Button type="submit" size="sm">
              {labels.linkApply}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
