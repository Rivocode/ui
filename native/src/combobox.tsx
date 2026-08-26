import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { summarize, toggleValue } from "./picker";
import { SearchInput } from "./search-input";
import { Sheet } from "./sheet";

export type ComboboxItem = { label: string; value: string; description?: string };

type ComboboxBaseProps = {
  items: ComboboxItem[];
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** O que dizer quando a busca nao acha nada - com o porque, como sempre. */
  emptyMessage?: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha de busca e da plataforma. */
  className?: string;
};

/** A mesma uniao do `Select`, pelo mesmo motivo: `multiple` decide o tipo do valor. */
export type ComboboxProps = ComboboxBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

/* Busca sem acento: "clinica" acha "Clínica", como no DataTable do web. */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * A lista longa, ou vinda do servidor: abre numa folha com busca em cima.
 * Poucas opcoes fixas continuam sendo Select - a mesma divisao do web.
 *
 * Com `multiple`, e aqui que a prop mais rende: escolher tres categorias entre
 * vinte e o caso que nao tinha peca nenhuma no nativo - o `CheckboxGroup` faz
 * escolha multipla, mas e uma lista de caixas empilhadas, e a vigesima fica
 * tres rolagens abaixo sem nenhum jeito de buscar por nome.
 */
export function Combobox(props: ComboboxProps) {
  const {
    items,
    label,
    placeholder,
    searchPlaceholder = "Buscar",
    emptyMessage = "Nada com esse nome. Confira a grafia ou tente outro termo.",
    disabled,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const summary = summarize(chosen, items);
  const visible = query ? items.filter((item) => fold(item.label).includes(fold(query))) : items;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const choose = (value: string) => {
    if (props.multiple) {
      /*
       * A busca fica escrita de proposito. Quem marca tres clientes costuma
       * marcar dois vizinhos da mesma consulta; limpar o campo a cada toque
       * jogaria a lista inteira de volta na tela e obrigaria a redigitar o
       * mesmo termo entre um e outro.
       */
      props.onValueChange(toggleValue(props.value, value));
      return;
    }
    props.onValueChange(value);
    close(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary ?? placeholder }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${summary ? "text-fg" : "text-fg-subtle"}`}>
          {summary ?? placeholder ?? "Selecione"}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={close} title={label}>
        <View className="gap-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            autoFocus
          />
          <ScrollView className="max-h-72" keyboardShouldPersistTaps="handled">
            {visible.length === 0 ? (
              <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
            ) : (
              <View className="gap-1">
                {visible.map((item) => {
                  const active = chosen.includes(item.value);
                  return (
                    <Pressable
                      key={item.value}
                      /* O papel segue o gesto, como no Select: alternar sem
                         fechar e caixa de marcar, decidir e fechar e botao. */
                      accessibilityRole={props.multiple ? "checkbox" : "button"}
                      accessibilityState={
                        props.multiple ? { checked: active } : { selected: active }
                      }
                      onPress={() => choose(item.value)}
                      className={`rounded-md px-3 py-3 ${active ? "bg-accent-subtle" : "active:bg-selected"}`}
                    >
                      <Text className={`text-base ${active ? "text-accent-text" : "text-fg"}`}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text className="text-xs text-fg-subtle">{item.description}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Fora da rolagem: com vinte opcoes o botao de terminar ficaria
              abaixo da lista, e so quem rolasse ate o fim o encontraria. */}
          {props.multiple && (
            <Button variant="secondary" onPress={() => close(false)}>
              Concluir
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
