import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { Progress } from "./basics";
import { Button } from "./button";
import { cn } from "./cn";
import { Input } from "./field";
import { Presence, useMotion, useSettled } from "./motion";
import {
  QUESTIONNAIRE_LABELS,
  progressPercent,
  questionnaireVerdict,
  type QuestionnaireAnswers,
  type QuestionnaireItemStatus,
  type QuestionnaireLabels,
  type QuestionnaireVerdict,
} from "./shared/questionnaire";
import { Text } from "./text";

export type { QuestionnaireAnswers, QuestionnaireItemStatus, QuestionnaireLabels };

export type QuestionnaireChoice = { label: string; value: string; description?: string };

export type QuestionnaireQuestion = {
  /** A chave da resposta em `value` e o valor de `item`. */
  name: string;
  title: string;
  description?: string;
  /** `single` e escolha unica, `multiple` e varias, `text` e resposta livre. */
  type: "single" | "multiple" | "text";
  /** As opcoes de `single` e `multiple`. */
  choices?: QuestionnaireChoice[];
  /** Liga o campo "Outra resposta" embaixo das opcoes. */
  other?: boolean;
  placeholder?: string;
  /** Sem resposta nao avanca, e o "Pular" some. */
  required?: boolean;
  /** Aparece sem responder, e fica fora da validacao e das respostas. */
  disabled?: boolean;
};

export type QuestionnaireProps = {
  /** As perguntas, na ordem em que aparecem. */
  items: QuestionnaireQuestion[];
  /** A pergunta aberta, pelo `name`. */
  item: string;
  onItemChange: (item: string) => void;
  /** As respostas: texto em `single` e `text`, lista em `multiple`. */
  value: QuestionnaireAnswers;
  onValueChange: (value: QuestionnaireAnswers) => void;
  /**
   * Chamado quando a ultima pergunta valida e todas as anteriores tambem, com
   * as respostas limpas: pergunta pulada, desabilitada ou vazia fica ausente.
   */
  onSubmit: (answers: QuestionnaireAnswers) => void;
  /** Chamado quando uma pergunta muda entre `unanswered`, `answered` e `skipped`. */
  onStatusChange?: (item: string, status: QuestionnaireItemStatus) => void;
  /** Os mesmos textos do web, e os mesmos nomes. */
  labels?: Partial<QuestionnaireLabels>;
  className?: string;
};

type Complaint = Exclude<QuestionnaireVerdict, "ok">;

const listOf = (answer: string | string[] | undefined) =>
  answer === undefined ? [] : Array.isArray(answer) ? answer : [answer];

const without = <T,>(record: Record<string, T>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));

const filled = (answer: string | string[] | undefined) =>
  listOf(answer).some((entry) => entry.trim() !== "");

function OptionMark({ multiple, checked }: { multiple: boolean; checked: boolean }) {
  if (multiple) {
    return (
      <View
        className={cn(
          "size-5 items-center justify-center rounded-sm border",
          checked ? "border-accent-text bg-accent-text" : "border-border-strong bg-surface",
        )}
      >
        <Presence show={checked} enter="popIn">
          <View className="mb-0.5 h-2 w-3 -rotate-45 border-b-2 border-l-2 border-surface-raised" />
        </Presence>
      </View>
    );
  }

  return (
    <View
      className={cn(
        "size-5 items-center justify-center rounded-pill border",
        checked ? "border-accent-text" : "border-border-strong",
      )}
    >
      <Presence show={checked} enter="popIn">
        <View className="size-2.5 rounded-pill bg-accent-text" />
      </Presence>
    </View>
  );
}

export function Questionnaire({
  items,
  item,
  onItemChange,
  value,
  onValueChange,
  onSubmit,
  onStatusChange,
  labels: labelsProp,
  className,
}: QuestionnaireProps) {
  const labels = { ...QUESTIONNAIRE_LABELS, ...labelsProp };
  const motion = useMotion();
  const settled = useSettled();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, Complaint>>({});

  const index = Math.max(
    0,
    items.findIndex((entry) => entry.name === item),
  );
  const current = items[index];
  const last = index === items.length - 1;

  const statuses = useMemo(() => {
    const map: Record<string, QuestionnaireItemStatus> = {};
    for (const entry of items) {
      map[entry.name] = filled(value[entry.name])
        ? "answered"
        : skipped.includes(entry.name)
          ? "skipped"
          : "unanswered";
    }
    return map;
  }, [items, value, skipped]);

  const reported = useRef(statuses);

  useEffect(() => {
    const before = reported.current;
    reported.current = statuses;
    for (const [name, status] of Object.entries(statuses)) {
      if ((before[name] ?? "unanswered") !== status) onStatusChange?.(name, status);
    }
  }, [statuses, onStatusChange]);

  const progress = labels.progress(index + 1, items.length);
  const heard = current ? `${progress}. ${current.title}` : "";
  const spoken = useRef(heard);

  useEffect(() => {
    if (spoken.current === heard) return;
    spoken.current = heard;
    if (heard) AccessibilityInfo.announceForAccessibility(heard);
  }, [heard]);

  if (!current) return null;

  const verdictOf = (entry: QuestionnaireQuestion) =>
    questionnaireVerdict(statuses[entry.name]!, entry.required ?? false, entry.disabled ?? false);

  const complain = (entry: QuestionnaireQuestion, verdict: Complaint) => {
    setErrors((before) => ({ ...before, [entry.name]: verdict }));
    AccessibilityInfo.announceForAccessibility(labels[verdict]);
    if (entry.name !== current.name) onItemChange(entry.name);
  };

  const answer = (next: string | string[]) => {
    const name = current.name;
    onValueChange({ ...value, [name]: next });
    if (filled(next)) {
      setSkipped((before) => before.filter((entry) => entry !== name));
      setErrors((before) => without(before, name));
    }
  };

  const submit = (justSkipped?: string) => {
    for (const entry of items) {
      if (entry.name === justSkipped) continue;
      const verdict = verdictOf(entry);
      if (verdict !== "ok") {
        complain(entry, verdict);
        return;
      }
    }
    const answers: QuestionnaireAnswers = {};
    for (const entry of items) {
      if (entry.name === justSkipped || entry.disabled) continue;
      if (statuses[entry.name] !== "answered") continue;
      const kept = listOf(value[entry.name])
        .map((text) => text.trim())
        .filter(Boolean);
      answers[entry.name] = entry.type === "multiple" ? kept : kept[0]!;
    }
    onSubmit(answers);
  };

  const next = () => {
    const verdict = verdictOf(current);
    if (verdict !== "ok") {
      complain(current, verdict);
      return;
    }
    if (last) submit();
    else onItemChange(items[index + 1]!.name);
  };

  const skip = () => {
    const name = current.name;
    onValueChange(without(value, name));
    setSkipped((before) => (before.includes(name) ? before : [...before, name]));
    setErrors((before) => without(before, name));
    if (last) submit(name);
    else onItemChange(items[index + 1]!.name);
  };

  const multiple = current.type === "multiple";
  const choices = current.type === "text" ? [] : (current.choices ?? []);
  const chosen = listOf(value[current.name]);
  const known = new Set(choices.map((choice) => choice.value));
  const otherText = chosen.find((entry) => !known.has(entry)) ?? "";
  const error = errors[current.name];
  const disabled = current.disabled ?? false;

  const toggle = (choice: string) => {
    if (!multiple) {
      answer(choice);
      return;
    }
    answer(
      chosen.includes(choice) ? chosen.filter((entry) => entry !== choice) : [...chosen, choice],
    );
  };

  const writeOther = (text: string) => {
    if (!multiple) {
      answer(text);
      return;
    }
    const kept = chosen.filter((entry) => known.has(entry));
    answer(text === "" ? kept : [...kept, text]);
  };

  return (
    <View className={cn("gap-5", className)}>
      <View className="gap-2">
        <Text className="text-sm text-fg-muted">{progress}</Text>
        <Progress value={progressPercent(index + 1, items.length)} label={progress} />
      </View>

      <Animated.View
        key={current.name}
        entering={settled ? motion.enter : undefined}
        className="gap-3"
      >
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            font="display"
            className={cn("text-lg font-semibold", disabled ? "text-fg-disabled" : "text-fg")}
          >
            {current.title}
            {current.required ? null : (
              <Text className="text-xs font-normal text-fg-subtle">
                {"  "}
                {labels.optional}
              </Text>
            )}
          </Text>
          {current.description ? (
            <Text className="text-sm text-fg-muted">{current.description}</Text>
          ) : null}
        </View>

        {choices.length > 0 ? (
          <View
            accessibilityRole={multiple ? "list" : "radiogroup"}
            accessibilityLabel={current.title}
            className="gap-2"
          >
            {choices.map((choice) => {
              const checked = chosen.includes(choice.value);
              return (
                <Pressable
                  key={choice.value}
                  accessibilityRole={multiple ? "checkbox" : "radio"}
                  accessibilityLabel={choice.label}
                  accessibilityState={{ checked, disabled }}
                  disabled={disabled}
                  onPress={() => toggle(choice.value)}
                  className={cn(
                    "min-h-12 flex-row items-center gap-3 rounded-md border bg-surface px-3 py-2.5",
                    checked ? "border-accent-text" : "border-border-strong",
                    disabled && "opacity-50",
                  )}
                >
                  <OptionMark multiple={multiple} checked={checked} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-base text-fg">{choice.label}</Text>
                    {choice.description ? (
                      <Text className="text-sm text-fg-muted">{choice.description}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {current.type === "text" || current.other ? (
          <Input
            value={current.type === "text" ? (chosen[0] ?? "") : otherText}
            onChangeText={current.type === "text" ? (text) => answer(text) : writeOther}
            placeholder={current.placeholder}
            accessibilityLabel={current.type === "text" ? current.title : labels.other}
            editable={!disabled}
            invalid={Boolean(error)}
            returnKeyType={last ? "send" : "next"}
            onSubmitEditing={next}
            className={disabled ? "opacity-50" : undefined}
          />
        ) : null}

        <Presence show={Boolean(error)} swapKey={error}>
          <Text accessibilityLiveRegion="polite" className="text-sm text-danger-text">
            {error ? labels[error] : ""}
          </Text>
        </Presence>
      </Animated.View>

      <View className="flex-row flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          disabled={index === 0}
          onPress={() => onItemChange(items[index - 1]!.name)}
        >
          {labels.previous}
        </Button>
        <View className="flex-1" />
        {current.required ? null : (
          <Button variant="ghost" onPress={skip}>
            {labels.skip}
          </Button>
        )}
        <Button onPress={next}>{last ? labels.submit : labels.next}</Button>
      </View>
    </View>
  );
}
