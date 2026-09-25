"use client";

import { Check } from "lucide-react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import {
  QUESTIONNAIRE_LABELS,
  progressPercent,
  questionnaireVerdict,
  shortcutIndex,
  shortcutKey,
  type QuestionnaireAnswers,
  type QuestionnaireItemStatus,
  type QuestionnaireLabels,
  type QuestionnaireShortcuts,
  type QuestionnaireVerdict,
} from "../shared/questionnaire";
import { Button, type ButtonProps } from "./button";
import { inputVariants } from "./field";
import { kbdVariants } from "./kbd";
import { Progress, type ProgressProps } from "./progress";

export type {
  QuestionnaireAnswers,
  QuestionnaireItemStatus,
  QuestionnaireLabels,
  QuestionnaireShortcuts,
};

type Entry = {
  element: HTMLFieldSetElement;
  required: boolean;
  multiple: boolean;
  disabled: boolean;
};

type Direction = "next" | "previous";

type Complaint = Exclude<QuestionnaireVerdict, "ok">;

type Meta = Omit<Entry, "element">;

type RootContext = {
  names: string[];
  rendered: { name: string; meta: Meta }[] | null;
  meta: Record<string, Meta>;
  active: string | undefined;
  direction: Direction | null;
  statuses: Record<string, QuestionnaireItemStatus>;
  errors: Record<string, Complaint>;
  labels: QuestionnaireLabels;
  shortcuts: QuestionnaireShortcuts | false;
  register: (name: string, entry: Entry) => () => void;
  refresh: (name: string) => void;
  previous: () => void;
  skip: () => void;
  next: () => void;
};

type ItemContext = {
  name: string;
  multiple: boolean;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  titleId: string;
  choices: string[];
  registerChoice: (value: string, element: HTMLInputElement) => () => void;
  claim: (part: "description" | "error", id: string) => () => void;
};

const QuestionnaireRootContext = createContext<RootContext | null>(null);
const QuestionnaireItemContext = createContext<ItemContext | null>(null);

function useRoot(part: string) {
  const context = use(QuestionnaireRootContext);
  if (!context) throw new Error(`${part} precisa estar dentro de <Questionnaire>.`);
  return context;
}

function useItem(part: string) {
  const context = use(QuestionnaireItemContext);
  if (!context) throw new Error(`${part} precisa estar dentro de <QuestionnaireItem>.`);
  return context;
}

const inDocumentOrder = <T extends Element>(entries: [string, T][]) =>
  [...entries]
    .sort(([, a], [, b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    .map(([name]) => name);

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const CHECKABLE = new Set(["radio", "checkbox"]);
const NOT_TYPING = new Set([
  "radio",
  "checkbox",
  "button",
  "submit",
  "reset",
  "range",
  "color",
  "file",
]);

function isTyping(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NOT_TYPING.has(target.type);
  return target instanceof HTMLElement && target.isContentEditable;
}

function controlsOf(element: HTMLFieldSetElement) {
  return [...element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")];
}

function hasAnswer(element: HTMLFieldSetElement) {
  return controlsOf(element).some((control) =>
    isCheckable(control) ? control.checked : control.value.trim() !== "",
  );
}

function isCheckable(control: HTMLInputElement | HTMLTextAreaElement): control is HTMLInputElement {
  return control instanceof HTMLInputElement && CHECKABLE.has(control.type);
}

function clearControl(control: HTMLInputElement | HTMLTextAreaElement) {
  const prototype = Object.getPrototypeOf(control) as object;
  if (isCheckable(control)) {
    if (!control.checked) return;
    Object.getOwnPropertyDescriptor(prototype, "checked")?.set?.call(control, false);
    control.dispatchEvent(new Event("click", { bubbles: true }));
    return;
  }
  if (control.value === "") return;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(control, "");
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

function clearAnswer(element: HTMLFieldSetElement) {
  for (const control of controlsOf(element)) clearControl(control);
}

function focusFirstControl(element: HTMLFieldSetElement) {
  const controls = controlsOf(element).filter((control) => !control.matches(":disabled"));
  const checked = controls.find(
    (control) => control instanceof HTMLInputElement && control.type === "radio" && control.checked,
  );
  (checked ?? controls[0])?.focus();
}

export type QuestionnaireProps = Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> & {
  /** A pergunta aberta, pelo `name` do item. Controlado; ande com `onItemChange`. */
  item?: string;
  /** A pergunta aberta no comeco, sem controlar. Sem ela, abre a primeira. */
  defaultItem?: string;
  /** Chamado a cada troca de pergunta, com o `name` da nova. */
  onItemChange?: (item: string) => void;
  /**
   * O atalho de cada opcao: `letters` marca a primeira com A, `numbers` com 1.
   * Vale com o foco dentro do questionario e para enquanto se digita num campo.
   * `false` desliga.
   */
  shortcuts?: QuestionnaireShortcuts | false;
  /**
   * Chamado quando a ultima pergunta valida e todas as anteriores tambem.
   * `answers` tem uma chave por item respondido: texto na escolha unica e no
   * campo livre, lista no `multiple`. O mesmo sai no `FormData`, e item pulado
   * fica ausente dos dois.
   */
  onSubmit?: (answers: QuestionnaireAnswers, data: FormData) => void;
  /** Os textos da peca: botoes, progresso e erros, para outra lingua ou outro tom. */
  labels?: Partial<QuestionnaireLabels>;
  ref?: Ref<HTMLFormElement>;
};

export function Questionnaire({
  item,
  defaultItem,
  onItemChange,
  shortcuts = "letters",
  onSubmit,
  labels: labelsProp,
  className,
  onKeyDown,
  children,
  ...props
}: QuestionnaireProps) {
  const registry = useRef(new Map<string, Entry>());
  const [names, setNames] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [chosen, setChosen] = useState(defaultItem);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [statuses, setStatuses] = useState<Record<string, QuestionnaireItemStatus>>({});
  const [errors, setErrors] = useState<Record<string, Complaint>>({});
  const statusRef = useRef(statuses);
  const pendingFocus = useRef<string | null>(null);

  const labels = useMemo(() => ({ ...QUESTIONNAIRE_LABELS, ...labelsProp }), [labelsProp]);

  const wanted = item ?? chosen;
  const active =
    names.length === 0
      ? wanted
      : wanted !== undefined && names.includes(wanted)
        ? wanted
        : names[0];
  const rendered = names.length === 0 ? [] : null;

  const setStatus = useCallback((name: string, status: QuestionnaireItemStatus) => {
    if (statusRef.current[name] === status) return;
    statusRef.current = { ...statusRef.current, [name]: status };
    setStatuses(statusRef.current);
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((current) => {
      if (!(name in current)) return current;
      return Object.fromEntries(Object.entries(current).filter(([key]) => key !== name));
    });
  }, []);

  const reorder = useCallback(() => {
    const entries = [...registry.current];
    const next = inDocumentOrder(entries.map(([name, entry]) => [name, entry.element]));
    setNames((current) => (sameList(current, next) ? current : next));
    setMeta(
      Object.fromEntries(
        entries.map(([name, { required, multiple, disabled }]) => [
          name,
          { required, multiple, disabled },
        ]),
      ),
    );
  }, []);

  const register = useCallback(
    (name: string, entry: Entry) => {
      registry.current.set(name, entry);
      if (!statusRef.current[name] && hasAnswer(entry.element)) setStatus(name, "answered");
      reorder();
      return () => {
        if (registry.current.get(name) === entry) registry.current.delete(name);
        reorder();
      };
    },
    [reorder, setStatus],
  );

  const refresh = useCallback(
    (name: string) => {
      const entry = registry.current.get(name);
      if (!entry) return;
      const answered = hasAnswer(entry.element);
      setStatus(name, answered ? "answered" : "unanswered");
      if (answered) clearError(name);
    },
    [setStatus, clearError],
  );

  const go = useCallback(
    (target: string, towards: Direction) => {
      pendingFocus.current = target;
      setDirection(towards);
      if (item === undefined) setChosen(target);
      onItemChange?.(target);
    },
    [item, onItemChange],
  );

  const verdictOf = useCallback((name: string) => {
    const entry = registry.current.get(name);
    if (!entry) return "ok" as const;
    return questionnaireVerdict(
      statusRef.current[name] ?? "unanswered",
      entry.required,
      entry.disabled,
    );
  }, []);

  const complain = useCallback(
    (name: string, verdict: Complaint) => {
      setErrors((current) => ({ ...current, [name]: verdict }));
      const entry = registry.current.get(name);
      if (name === active) {
        if (entry) focusFirstControl(entry.element);
      } else {
        go(name, names.indexOf(name) < names.indexOf(active ?? "") ? "previous" : "next");
      }
    },
    [active, go, names],
  );

  const submit = useCallback(() => {
    for (const name of names) {
      const verdict = verdictOf(name);
      if (verdict !== "ok") {
        complain(name, verdict);
        return;
      }
    }

    const form = registry.current.get(names[0] ?? "")?.element.form;
    const data = form ? new FormData(form) : new FormData();
    const answers: QuestionnaireAnswers = {};

    for (const name of names) {
      const entry = registry.current.get(name)!;
      const values = data
        .getAll(name)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);
      data.delete(name);
      if (entry.disabled || statusRef.current[name] === "skipped" || values.length === 0) continue;
      for (const value of values) data.append(name, value);
      answers[name] = entry.multiple ? values : values[0]!;
    }

    onSubmit?.(answers, data);
  }, [names, verdictOf, complain, onSubmit]);

  const next = useCallback(() => {
    if (active === undefined) return;
    const verdict = verdictOf(active);
    if (verdict !== "ok") {
      complain(active, verdict);
      return;
    }
    const index = names.indexOf(active);
    if (index === names.length - 1) submit();
    else go(names[index + 1]!, "next");
  }, [active, names, verdictOf, complain, submit, go]);

  const previous = useCallback(() => {
    const index = active === undefined ? -1 : names.indexOf(active);
    if (index > 0) go(names[index - 1]!, "previous");
  }, [active, names, go]);

  const skip = useCallback(() => {
    if (active === undefined) return;
    const entry = registry.current.get(active);
    if (!entry || entry.required) return;
    clearAnswer(entry.element);
    setStatus(active, "skipped");
    clearError(active);
    const index = names.indexOf(active);
    if (index === names.length - 1) submit();
    else go(names[index + 1]!, "next");
  }, [active, names, setStatus, clearError, submit, go]);

  useEffect(() => {
    if (active === undefined || pendingFocus.current !== active) return;
    pendingFocus.current = null;
    const entry = registry.current.get(active);
    if (entry && !entry.disabled) focusFirstControl(entry.element);
  }, [active]);

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      next();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement &&
      isTyping(event.target)
    ) {
      event.preventDefault();
      next();
      return;
    }

    if (!shortcuts || isTyping(event.target) || active === undefined) return;
    const index = shortcutIndex(event.key, shortcuts);
    const entry = registry.current.get(active);
    if (index < 0 || !entry || entry.disabled) return;

    const choice = entry.element.querySelectorAll<HTMLInputElement>(
      "input[data-questionnaire-choice]",
    )[index];
    if (!choice || choice.matches(":disabled")) return;

    event.preventDefault();
    choice.focus();
    if (choice.type === "checkbox" || !choice.checked) choice.click();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    next();
  }

  const context = useMemo<RootContext>(
    () => ({
      names,
      rendered,
      meta,
      active,
      direction,
      statuses,
      errors,
      labels,
      shortcuts,
      register,
      refresh,
      previous,
      skip,
      next,
    }),
    [
      names,
      rendered,
      meta,
      active,
      direction,
      statuses,
      errors,
      labels,
      shortcuts,
      register,
      refresh,
      previous,
      skip,
      next,
    ],
  );

  return (
    <QuestionnaireRootContext value={context}>
      <form
        {...props}
        noValidate
        data-item={active}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
        className={cn("flex w-full min-w-0 flex-col gap-5 font-sans", className)}
      >
        {children}
      </form>
    </QuestionnaireRootContext>
  );
}

export type QuestionnaireProgressProps = Omit<
  ProgressProps,
  | "value"
  | "label"
  | "showValue"
  | "format"
  | "numberFormat"
  | "min"
  | "max"
  | "getAriaValueText"
  | "aria-valuetext"
>;

export function QuestionnaireProgress(props: QuestionnaireProgressProps) {
  const { names, active, labels } = useRoot("QuestionnaireProgress");
  const position = active === undefined ? 0 : names.indexOf(active) + 1;
  const text = labels.progress(position, names.length);

  return (
    <Progress
      {...props}
      value={progressPercent(position, names.length)}
      label={text}
      getAriaValueText={() => text}
    />
  );
}

export type QuestionnaireItemProps = Omit<
  ComponentPropsWithoutRef<"fieldset">,
  "name" | "disabled"
> & {
  /** A chave da resposta: vira o `name` dos controles, a chave de `answers` e o valor de `item`. */
  name: string;
  /** Sem resposta nao avanca, e o "Pular" some. Sem ele, a pergunta aceita pular. */
  required?: boolean;
  /** Varias respostas: as opcoes viram caixas de marcar, e a resposta vira lista. */
  multiple?: boolean;
  /** A pergunta aparece, mas nao responde: fica fora da validacao e das respostas. */
  disabled?: boolean;
  /** Chamado quando a pergunta muda entre `unanswered`, `answered` e `skipped`. */
  onStatusChange?: (status: QuestionnaireItemStatus) => void;
};

export function QuestionnaireItem({
  name,
  required = false,
  multiple = false,
  disabled = false,
  onStatusChange,
  className,
  children,
  onChange,
  ...props
}: QuestionnaireItemProps) {
  const root = useRoot("QuestionnaireItem");
  const { register, refresh } = root;
  const ref = useRef<HTMLFieldSetElement>(null);
  const titleId = useId();
  const automaticErrorId = useId();
  const choiceRegistry = useRef(new Map<string, HTMLInputElement>());
  const [choices, setChoices] = useState<string[]>([]);
  const [parts, setParts] = useState<{ description?: string; error?: string }>({});

  useLayoutEffect(
    () => register(name, { element: ref.current!, required, multiple, disabled }),
    [register, name, required, multiple, disabled],
  );

  const registerChoice = useCallback((value: string, element: HTMLInputElement) => {
    const sync = () => {
      const next = inDocumentOrder([...choiceRegistry.current]);
      setChoices((current) => (sameList(current, next) ? current : next));
    };
    choiceRegistry.current.set(value, element);
    sync();
    return () => {
      if (choiceRegistry.current.get(value) === element) choiceRegistry.current.delete(value);
      sync();
    };
  }, []);

  const claim = useCallback((part: "description" | "error", id: string) => {
    setParts((current) => ({ ...current, [part]: id }));
    return () =>
      setParts((current) => (current[part] === id ? { ...current, [part]: undefined } : current));
  }, []);

  const status = root.statuses[name] ?? "unanswered";
  const reported = useRef(status);

  useEffect(() => {
    if (reported.current === status) return;
    reported.current = status;
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  if (root.rendered && !root.rendered.some((entry) => entry.name === name)) {
    root.rendered.push({ name, meta: { required, multiple, disabled } });
  }
  const isActive = (root.active ?? root.rendered?.[0]?.name) === name;
  const verdict = root.errors[name];
  const invalid = verdict !== undefined;

  function handleChange(event: ChangeEvent<HTMLFieldSetElement>) {
    onChange?.(event);
    const target = event.target as EventTarget;
    const element = ref.current;
    if (element && !multiple && target instanceof HTMLInputElement) {
      if (target.type === "radio" && target.checked) {
        for (const control of controlsOf(element)) {
          if (!isCheckable(control)) clearControl(control);
        }
      } else if (!CHECKABLE.has(target.type) && target.value.trim() !== "") {
        for (const control of controlsOf(element)) {
          if (control instanceof HTMLInputElement && control.type === "radio") {
            clearControl(control);
          }
        }
      }
    }
    refresh(name);
  }

  const context = useMemo<ItemContext>(
    () => ({
      name,
      multiple,
      required,
      disabled,
      invalid,
      titleId,
      choices,
      registerChoice,
      claim,
    }),
    [name, multiple, required, disabled, invalid, titleId, choices, registerChoice, claim],
  );

  const errorId = parts.error ?? automaticErrorId;
  const describedBy = [parts.description, invalid ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <QuestionnaireItemContext value={context}>
      <fieldset
        {...props}
        ref={ref}
        name={name}
        disabled={disabled}
        hidden={!isActive}
        inert={!isActive}
        aria-describedby={describedBy || undefined}
        data-questionnaire-item=""
        data-status={status}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        onChange={handleChange}
        className={cn(
          "flex min-w-0 flex-col gap-3",
          isActive && root.direction === "next" && "motion-safe:animate-shift-in-next",
          isActive && root.direction === "previous" && "motion-safe:animate-shift-in-previous",
          "motion-reduce:animate-none",
          className,
        )}
      >
        {children}
        {invalid && !parts.error && (
          <ErrorMessage id={automaticErrorId}>{root.labels[verdict!]}</ErrorMessage>
        )}
      </fieldset>
    </QuestionnaireItemContext>
  );
}

export type QuestionnaireTitleProps = ComponentPropsWithoutRef<"legend">;

export function QuestionnaireTitle({ className, children, ...props }: QuestionnaireTitleProps) {
  const { labels } = useRoot("QuestionnaireTitle");
  const { titleId, required } = useItem("QuestionnaireTitle");

  return (
    <legend
      id={titleId}
      {...props}
      className={cn(
        "float-left w-full font-display font-rc-display text-lg leading-[var(--rc-leading-tight)] tracking-tight",
        "text-fg in-data-[disabled]:text-fg-disabled",
        className,
      )}
    >
      {children}
      {!required && <span className="sr-only">, </span>}
      {!required && (
        <span className="ml-2 align-middle font-sans font-rc-regular text-xs tracking-normal text-fg-subtle">
          {labels.optional}
        </span>
      )}
    </legend>
  );
}

export type QuestionnaireDescriptionProps = ComponentPropsWithoutRef<"p">;

export function QuestionnaireDescription({
  className,
  id,
  ...props
}: QuestionnaireDescriptionProps) {
  const { claim } = useItem("QuestionnaireDescription");
  const own = useId();
  const descriptionId = id ?? own;

  useLayoutEffect(() => claim("description", descriptionId), [claim, descriptionId]);

  return (
    <p
      {...props}
      id={descriptionId}
      className={cn("-mt-1.5 text-sm text-fg-muted in-data-[disabled]:text-fg-disabled", className)}
    />
  );
}

export type QuestionnaireChoicesProps = ComponentPropsWithoutRef<"div">;

export function QuestionnaireChoices({ className, ...props }: QuestionnaireChoicesProps) {
  useItem("QuestionnaireChoices");
  return <div {...props} className={cn("flex flex-col gap-2", className)} />;
}

export type QuestionnaireChoiceProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "name" | "value" | "children"
> & {
  /** O valor que vai para `answers` e para o `FormData` quando a opcao esta marcada. */
  value: string;
  /** O texto da opcao. Clicar nele marca. */
  children: ReactNode;
  /** A linha de apoio embaixo do texto. */
  description?: ReactNode;
  /** Classe por parte: `control` (a linha inteira), `key`, `label`, `description`, `indicator`. */
  classNames?: Slots<"control" | "key" | "label" | "description" | "indicator">;
};

export function QuestionnaireChoice({
  value,
  children,
  description,
  disabled,
  className,
  classNames,
  ...props
}: QuestionnaireChoiceProps) {
  const { shortcuts } = useRoot("QuestionnaireChoice");
  const item = useItem("QuestionnaireChoice");
  const { registerChoice } = item;
  const ref = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => registerChoice(value, ref.current!), [registerChoice, value]);

  const index = item.choices.indexOf(value);
  const key = shortcuts && index >= 0 ? shortcutKey(index, shortcuts) : null;

  return (
    <label
      className={cn(
        "group/choice flex cursor-pointer items-center gap-3 rounded-md border border-border-strong",
        "bg-surface px-3 py-2.5 text-base text-fg",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "hover:bg-surface-raised",
        "has-[:checked]:border-accent-text has-[[aria-invalid]]:border-danger",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        "has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-border",
        "has-[:disabled]:text-fg-disabled has-[:disabled]:hover:bg-surface",
        classNames?.control,
        className,
      )}
    >
      <input
        {...props}
        ref={ref}
        type={item.multiple ? "checkbox" : "radio"}
        name={item.name}
        disabled={item.disabled || disabled}
        value={value}
        aria-keyshortcuts={key ?? undefined}
        aria-invalid={item.invalid || undefined}
        data-questionnaire-choice=""
        className="sr-only"
      />
      {key && (
        <kbd
          aria-hidden="true"
          className={cn(
            kbdVariants({ size: "md" }),
            "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
            "group-has-[:checked]/choice:border-accent-text group-has-[:checked]/choice:bg-accent-text",
            "group-has-[:checked]/choice:text-surface-raised",
            "group-has-[:disabled]/choice:text-fg-disabled",
            classNames?.key,
          )}
        >
          {key}
        </kbd>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-pretty", classNames?.label)}>{children}</span>
        {description && (
          <span
            className={cn(
              "text-sm text-fg-muted group-has-[:disabled]/choice:text-fg-disabled",
              classNames?.description,
            )}
          >
            {description}
          </span>
        )}
      </span>
      <Check
        aria-hidden="true"
        className={cn(
          "invisible size-4 shrink-0 text-accent-text group-has-[:checked]/choice:visible",
          classNames?.indicator,
        )}
      />
    </label>
  );
}

export type QuestionnaireInputProps = Omit<ComponentPropsWithoutRef<"input">, "name" | "size"> & {
  ref?: Ref<HTMLInputElement>;
};

export function QuestionnaireInput({
  className,
  type = "text",
  disabled,
  ...props
}: QuestionnaireInputProps) {
  const { labels } = useRoot("QuestionnaireInput");
  const item = useItem("QuestionnaireInput");
  const beside = item.choices.length > 0;
  const named = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;

  return (
    <input
      aria-label={!named && beside ? labels.other : undefined}
      aria-labelledby={!named && !beside ? item.titleId : undefined}
      aria-invalid={item.invalid || undefined}
      {...props}
      type={type}
      name={item.name}
      disabled={item.disabled || disabled}
      data-invalid={item.invalid ? "" : undefined}
      className={cn(inputVariants({ size: "md" }), className)}
    />
  );
}

export type QuestionnaireErrorProps = ComponentPropsWithoutRef<"p">;

function ErrorMessage({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} role="alert" className={cn("text-sm text-danger-text", className)} />;
}

export function QuestionnaireError({ children, id, ...props }: QuestionnaireErrorProps) {
  const { errors, labels } = useRoot("QuestionnaireError");
  const { name, claim } = useItem("QuestionnaireError");
  const own = useId();
  const errorId = id ?? own;

  useLayoutEffect(() => claim("error", errorId), [claim, errorId]);

  const verdict = errors[name];
  if (verdict === undefined) return null;

  return (
    <ErrorMessage {...props} id={errorId}>
      {children ?? labels[verdict]}
    </ErrorMessage>
  );
}

export type QuestionnaireFooterProps = ComponentPropsWithoutRef<"div">;

export function QuestionnaireFooter({ className, ...props }: QuestionnaireFooterProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        "[&>[data-questionnaire-previous]]:mr-auto",
        className,
      )}
    />
  );
}

function useNavigation(part: string) {
  const root = useRoot(part);
  const names = root.rendered ? root.rendered.map((entry) => entry.name) : root.names;
  const current = root.active ?? names[0];
  const index = current === undefined ? -1 : names.indexOf(current);
  const meta =
    current === undefined
      ? undefined
      : (root.meta[current] ?? root.rendered?.find((entry) => entry.name === current)?.meta);
  return { root, index, last: index === names.length - 1, meta };
}

function withAction(
  onClick: ButtonProps["onClick"],
  action: () => void,
): (event: MouseEvent<HTMLButtonElement>) => void {
  return (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) action();
  };
}

export type QuestionnaireNavProps = Omit<ButtonProps, "type" | "render">;

export function QuestionnairePrevious({
  children,
  onClick,
  disabled,
  variant = "ghost",
  ...props
}: QuestionnaireNavProps) {
  const { root, index } = useNavigation("QuestionnairePrevious");

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      data-questionnaire-previous=""
      disabled={disabled || index <= 0}
      onClick={withAction(onClick, root.previous)}
    >
      {children ?? root.labels.previous}
    </Button>
  );
}

export function QuestionnaireSkip({
  children,
  onClick,
  variant = "ghost",
  ...props
}: QuestionnaireNavProps) {
  const { root, meta } = useNavigation("QuestionnaireSkip");
  if (!meta || meta.required) return null;

  return (
    <Button {...props} type="button" variant={variant} onClick={withAction(onClick, root.skip)}>
      {children ?? root.labels.skip}
    </Button>
  );
}

export function QuestionnaireNext({
  children,
  onClick,
  variant = "primary",
  ...props
}: QuestionnaireNavProps) {
  const { root, index, last } = useNavigation("QuestionnaireNext");
  if (index < 0 || last) return null;

  return (
    <Button
      {...props}
      type="button"
      variant={variant}
      aria-keyshortcuts="Control+Enter Meta+Enter"
      onClick={withAction(onClick, root.next)}
    >
      {children ?? root.labels.next}
    </Button>
  );
}

export function QuestionnaireSubmit({
  children,
  variant = "primary",
  ...props
}: QuestionnaireNavProps) {
  const { root, index, last } = useNavigation("QuestionnaireSubmit");
  if (index < 0 || !last) return null;

  return (
    <Button {...props} type="submit" variant={variant} aria-keyshortcuts="Control+Enter Meta+Enter">
      {children ?? root.labels.submit}
    </Button>
  );
}
