import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { MonthView, formatDate, useMonthOf, type DayPaint } from "./calendar";
import { cn } from "./cn";
import { Sheet } from "./sheet";

/**
 * O intervalo, sempre completo e sempre em ordem.
 *
 * O web tem `to` opcional porque lá o painel fica ancorado ao lado do gatilho
 * e a tela atrás continua visível: entre o primeiro e o segundo clique ele
 * emite `{ from }` sem `to`, para o resumo do filtro acompanhar a escolha. Sob
 * uma folha de baixo não há tela atrás para acompanhar nada, então o meio da
 * escolha nunca sai daqui — e o tipo pode prometer as duas datas.
 */
export type DateRange = {
  /** `aaaa-mm-dd`, como no `DatePicker`. */
  from: string;
  to: string;
};

/** O que está escolhido enquanto a folha está aberta: `to` ainda pode faltar. */
type Draft = { from: string; to: string | null };

export type DateRangePickerProps = {
  value: DateRange | null;
  /** `null` quando a pessoa toca em Limpar. */
  onValueChange: (range: DateRange | null) => void;
  /** O que o leitor de tela anuncia no gatilho, e o título da folha. */
  label: string;
  placeholder?: string;
  /** Limites inclusivos, no mesmo formato ISO. */
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha é a mesma para todos. */
  className?: string;
};

/**
 * O intervalo de datas, para filtro de relatório e de listagem.
 *
 * **Um mês só, numa folha, com a faixa pintada no próprio mês.** As outras
 * duas saídas foram medidas e descartadas. Dois meses lado a lado é o padrão
 * do web e não cabe: 390px partidos ao meio dão 27px de célula, e o alvo de
 * toque mínimo é 44. Dois `DatePicker` em sequência é o que a tabela de
 * paridade mandava fazer até agora, e é justamente o que se perde ao escolher
 * período — as duas pontas na mesma grade, com os dias do meio pintados, que é
 * a única leitura que responde "isto pega o fim de semana inteiro?".
 *
 * Trocar de mês entre a primeira e a segunda ponta é o gesto normal aqui, e é
 * por isso que o mês fica no chevron e não some ao tocar: um intervalo de 20 de
 * agosto a 3 de setembro se escolhe atravessando a virada.
 *
 * **A ordem das pontas deixou de ser problema da tela.** A tabela de paridade
 * dizia que validar fim-antes-do-começo era do app; agora não há como
 * escrever um intervalo invertido, porque a peça ordena os dois toques —
 * tocar 20 e depois 5 devolve 5 a 20, que é o que a pessoa quis dizer, e
 * descartar o primeiro toque só a faria repetir tudo. O `Aplicar` também não
 * liga com meia escolha: sem a segunda ponta ele fica desligado, e a listagem
 * nunca recebe um período que começa e não termina.
 */
export function DateRangePicker({
  value,
  onValueChange,
  label,
  placeholder = "Escolha o período",
  min,
  max,
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(value);

  const written = value ? `${formatDate(value.from)} – ${formatDate(value.to)}` : placeholder;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: written }}
        disabled={disabled}
        onPress={() => {
          // O rascunho volta ao que está valendo a cada abertura: sair pelo
          // gesto de fechar a folha é desistir, e desistir não pode deixar
          // meia escolha guardada para a próxima vez.
          setDraft(value);
          setOpen(true);
        }}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text numberOfLines={1} className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}>
          {written}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <RangeSheet
          draft={draft}
          onDraftChange={setDraft}
          min={min}
          max={max}
          onApply={(range) => {
            onValueChange(range);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

/**
 * O miolo da folha, num componente próprio pelo mesmo motivo do
 * `ButtonSpinner`: o mês é `useState`, e ele precisa nascer de novo — no mês
 * da escolha — a cada abertura. Dentro do `DateRangePicker` o estado do mês
 * sobreviveria à folha fechada, e reabrir em setembro um filtro de agosto é o
 * tipo de coisa que ninguém reporta e todo mundo estranha.
 */
function RangeSheet({
  draft,
  onDraftChange,
  min,
  max,
  onApply,
}: {
  draft: Draft | null;
  onDraftChange: (draft: Draft | null) => void;
  min?: string;
  max?: string;
  onApply: (range: DateRange | null) => void;
}) {
  const { year, month, onMonthChange } = useMonthOf(draft?.from);

  const paintOf = (iso: string): DayPaint => {
    if (draft === null) return { chosen: false };
    if (draft.to === null) {
      const start = iso === draft.from;
      return { chosen: start, edge: start ? "both" : undefined };
    }

    const isStart = iso === draft.from;
    const isEnd = iso === draft.to;
    if (isStart || isEnd) {
      return {
        chosen: true,
        edge: draft.from === draft.to ? "both" : isStart ? "start" : "end",
      };
    }
    return { chosen: false, within: iso > draft.from && iso < draft.to };
  };

  return (
    <View className="gap-4">
      {/* O resumo que no web mora na tela atrás do painel ancorado. Aqui a
          folha cobre o gatilho, então ele entra na folha - e como região viva,
          para o leitor de tela dizer o que mudou depois do primeiro toque, que
          é o momento em que a grade sozinha não conta nada. */}
      <Text accessibilityLiveRegion="polite" className="text-sm text-fg-muted">
        {describe(draft)}
      </Text>

      <MonthView
        year={year}
        month={month}
        onMonthChange={onMonthChange}
        min={min}
        max={max}
        paintOf={paintOf}
        onDayPress={(iso) => onDraftChange(nextDraft(draft, iso))}
      />

      <View className="flex-row items-center justify-between gap-3">
        <Button
          variant="ghost"
          onPress={() => {
            onDraftChange(null);
            onApply(null);
          }}
        >
          Limpar
        </Button>
        <Button
          disabled={draft === null || draft.to === null}
          onPress={() => {
            if (draft === null || draft.to === null) return;
            onApply({ from: draft.from, to: draft.to });
          }}
        >
          Aplicar
        </Button>
      </View>
    </View>
  );
}

/**
 * O que o toque faz com a escolha de agora.
 *
 * Três casos, e o do meio é a regra que substitui a validação que era do app:
 * com uma ponta posta, o toque seguinte fecha o intervalo pelas extremidades,
 * na ordem em que as datas caem no calendário e não na ordem em que o dedo as
 * tocou.
 */
function nextDraft(draft: Draft | null, iso: string): Draft {
  if (draft === null || draft.to !== null) return { from: iso, to: null };
  return iso < draft.from ? { from: iso, to: draft.from } : { from: draft.from, to: iso };
}

function describe(draft: Draft | null): string {
  if (draft === null) return "Toque no primeiro dia do período.";
  if (draft.to === null) return `${formatDate(draft.from)} – toque no último dia.`;
  return `${formatDate(draft.from)} – ${formatDate(draft.to)}`;
}
