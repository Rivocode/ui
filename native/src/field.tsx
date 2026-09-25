import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";

import { useAnnounce } from "./announce";
import { cn } from "./cn";
import { Presence } from "./motion";
import { useRivo } from "./provider";
import { Text, TextInput, type TextInputProps } from "./text";

export type FieldValidationMode = "onSubmit" | "onBlur" | "onChange";

type FieldVerdict = string | string[] | null | void;

export type FieldProps = {
  label: string;
  children: ReactNode;
  /** A ajuda embaixo do campo. */
  description?: string;
  /** O erro vence a descricao, como no web. Vence tambem o que o `validate` devolveu. */
  error?: string;
  /**
   * A validacao do proprio campo, com a assinatura do web: recebe o valor do
   * controle e devolve a mensagem, uma lista delas, ou nada quando o valor
   * serve. Pode ser assincrona, e so a resposta da ultima chamada vale. O
   * `formValues` chega vazio: no nativo nao ha `<form>` para ler.
   */
  validate?: (
    value: unknown,
    formValues: Record<string, unknown>,
  ) => FieldVerdict | Promise<FieldVerdict>;
  /**
   * Quando o `validate` roda, como no web. `onSubmit` e a tecla de envio do
   * teclado, `onBlur` e a saida do campo, `onChange` e cada tecla. Fora do
   * `onChange`, digitar apaga o erro ate a proxima validacao.
   */
  validationMode?: FieldValidationMode;
  /** Espera, em milissegundos, entre a tecla e o `validate` no modo `onChange`. */
  validationDebounceTime?: number;
  className?: string;
};

type FieldControlLink = {
  error: string | undefined;
  change: (value: unknown) => void;
  blur: (value: unknown) => void;
  submit: (value: unknown) => void;
};

const FieldControl = createContext<FieldControlLink | null>(null);

const NO_FORM_VALUES: Record<string, unknown> = Object.freeze({});

const messagesOf = (verdict: FieldVerdict): string[] =>
  verdict ? ([] as string[]).concat(verdict).filter(Boolean) : [];

const isPromise = (value: unknown): value is Promise<FieldVerdict> =>
  typeof value === "object" && value !== null && "then" in value;

function useFieldValidation(
  validate: FieldProps["validate"],
  mode: FieldValidationMode,
  debounce: number,
) {
  const [errors, setErrors] = useState<string[]>([]);
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ validate, mode, errors });
  latest.current = { validate, mode, errors };

  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const commit = async (value: unknown) => {
    clearTimer();
    const current = latest.current;
    if (!current.validate) return;
    const id = ++run.current;
    const outcome = current.validate(value, NO_FORM_VALUES);
    if (!isPromise(outcome)) {
      setErrors(messagesOf(outcome));
      return;
    }
    if (current.mode === "onSubmit" || current.errors.length === 0) setErrors([]);
    let verdict: FieldVerdict;
    try {
      verdict = await outcome;
    } catch {
      return;
    }
    if (id !== run.current) return;
    setErrors(messagesOf(verdict));
  };

  const change = (value: unknown) => {
    clearTimer();
    run.current += 1;
    if (latest.current.mode !== "onChange") {
      if (latest.current.errors.length > 0) setErrors([]);
      return;
    }
    if (value !== "" && debounce > 0) {
      timer.current = setTimeout(() => void commit(value), debounce);
      return;
    }
    void commit(value);
  };

  const blur = (value: unknown) => {
    if (latest.current.mode === "onBlur") void commit(value);
  };

  const submit = (value: unknown) => {
    void commit(value);
  };

  return { errors, change, blur, submit };
}

export function Field({
  label,
  children,
  description,
  error,
  validate,
  validationMode = "onSubmit",
  validationDebounceTime = 0,
  className,
}: FieldProps) {
  const validation = useFieldValidation(validate, validationMode, validationDebounceTime);
  const shown = error || validation.errors.join("\n") || undefined;

  useAnnounce(shown, { liveRegion: true });

  const link: FieldControlLink = {
    error: shown,
    change: validation.change,
    blur: validation.blur,
    submit: validation.submit,
  };

  return (
    <View className={cn("gap-1.5", className)}>
      <Text className="text-sm font-rc-medium text-fg">{label}</Text>
      <FieldControl value={link}>{children}</FieldControl>
      <Presence
        show={Boolean(shown || description)}
        swapKey={shown ? `erro:${shown}` : description}
      >
        {shown ? (
          <Text accessibilityLiveRegion="polite" className="text-xs text-danger-text">
            {shown}
          </Text>
        ) : (
          <Text className="text-xs text-fg-subtle">{description}</Text>
        )}
      </Presence>
    </View>
  );
}

export function useFieldControl(value: TextInputProps["value"]) {
  const field = use(FieldControl);
  const typed = useRef<string | undefined>(undefined);
  const reported = useRef(value);
  const report = useRef(field);
  report.current = field;

  useEffect(() => {
    if (value === reported.current) return;
    reported.current = value;
    if (value !== undefined) report.current?.change(value);
  }, [value]);

  const current = () => value ?? typed.current ?? "";

  return {
    error: field?.error,
    change(text: string) {
      typed.current = text;
      if (value === undefined) field?.change(text);
    },
    blur() {
      field?.blur(current());
    },
    submit() {
      field?.submit(current());
    },
  };
}

const sameValue = (a: unknown, b: unknown): boolean =>
  Object.is(a, b) ||
  (Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((item, index) => Object.is(item, b[index])));

type SheetExit = "blur" | "submit";

export function useFieldSheet(value: unknown) {
  const field = use(FieldControl);
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const pending = useRef<SheetExit | null>(null);
  const reported = useRef(value);
  const latest = useRef(value);
  const report = useRef(field);
  latest.current = value;
  report.current = field;

  useEffect(() => {
    if (sameValue(value, reported.current)) return;
    reported.current = value;
    report.current?.change(value);
  }, [value]);

  useEffect(() => {
    const exit = pending.current;
    if (exit === null) return;
    pending.current = null;
    report.current?.[exit](latest.current);
  });

  const show = () => {
    shown.current = true;
    setOpen(true);
  };

  const close = (exit: SheetExit = "blur") => {
    if (!shown.current) return;
    shown.current = false;
    pending.current = exit;
    setOpen(false);
  };

  return {
    open,
    show,
    close,
    onOpenChange: (next: boolean) => (next ? show() : close()),
    error: field?.error,
  };
}

export function WithoutField({ children }: { children: ReactNode }) {
  return <FieldControl value={null}>{children}</FieldControl>;
}

export type InputProps = TextInputProps & {
  invalid?: boolean;
  /** Recebe o texto a cada tecla, como o `onValueChange` do Input web. Convive com o `onChangeText`: os dois sao chamados. */
  onValueChange?: (value: string) => void;
};

export function Input({
  invalid,
  onFocus,
  onBlur,
  onChangeText,
  onValueChange,
  onSubmitEditing,
  accessibilityHint,
  className,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();
  const field = useFieldControl(props.value);
  const flagged = invalid ?? Boolean(field.error);

  return (
    <TextInput
      {...props}
      accessibilityHint={accessibilityHint ?? field.error}
      onChangeText={(text) => {
        field.change(text);
        onChangeText?.(text);
        onValueChange?.(text);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        field.blur();
        onBlur?.(event);
      }}
      onSubmitEditing={(event) => {
        field.submit();
        onSubmitEditing?.(event);
      }}
      placeholderTextColor={colors["fg-subtle"]}
      className={cn(
        "h-12 rounded-md border bg-surface px-3.5 text-base text-fg",
        flagged ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    />
  );
}
