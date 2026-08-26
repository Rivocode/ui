import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { summarize, toggleValue } from "./picker";
import { Sheet } from "./sheet";

export type SelectItem = { label: string; value: string };

type SelectBaseProps = {
  items: SelectItem[];
  /** O que o gatilho mostra sem escolha: "Selecione o período". */
  placeholder?: string;
  label: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha de opcoes e da plataforma. */
  className?: string;
};

/**
 * Escolha unica e escolha multipla nao dividem o tipo do valor, e por isso sao
 * dois membros de uma uniao em vez de um `value: string | string[]`: com a
 * uniao solta, quem esquecesse o `multiple` recebia `string[]` no callback de
 * escolha unica sem o compilador dizer nada. `multiple` e o discriminante, o
 * mesmo nome e o mesmo efeito do web - la ele vira array pela Base UI.
 */
export type SelectProps = SelectBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

/**
 * Poucas opcoes fixas, como no web - so que aqui a lista abre numa folha de
 * baixo, que e o idioma da plataforma para escolher. Lista longa ou vinda do
 * servidor e o `Combobox`, que abre a mesma folha com busca em cima.
 *
 * Com `multiple`, escolher passa a alternar e a folha FICA aberta: fechar a
 * cada toque tornaria impossivel o caso que a prop existe para atender, que e
 * escolher tres categorias de uma vez. Quem termina fecha pelo "Concluir", pelo
 * fundo ou pelo gesto da plataforma.
 */
export function Select(props: SelectProps) {
  const { items, placeholder, label, disabled, className } = props;
  const [open, setOpen] = useState(false);

  // A escolha unica vira lista de zero ou um item, e dai para baixo o arquivo
  // trata os dois casos do mesmo jeito - so o `choose` e o papel do item se
  // importam com a diferenca.
  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const summary = summarize(chosen, items);

  const choose = (value: string) => {
    if (props.multiple) {
      props.onValueChange(toggleValue(props.value, value));
      return;
    }
    props.onValueChange(value);
    setOpen(false);
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

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <View className="gap-1">
          {items.map((item) => {
            const active = chosen.includes(item.value);
            return (
              <Pressable
                key={item.value}
                /*
                 * O papel segue o gesto, e o gesto muda com o `multiple`: na
                 * escolha unica tocar decide e fecha, que e botao; na multipla
                 * tocar liga e desliga e a folha fica, que e caixa de marcar.
                 * Deixar tudo como botao custava o anuncio: "botao,
                 * selecionado" o TalkBack nao le de forma confiavel, e a pessoa
                 * ficava sem saber quais das vinte opcoes ja tinha marcado.
                 */
                accessibilityRole={props.multiple ? "checkbox" : "button"}
                accessibilityState={props.multiple ? { checked: active } : { selected: active }}
                onPress={() => choose(item.value)}
                className={`flex-row items-center justify-between rounded-md px-3 py-3 ${
                  active ? "bg-accent-subtle" : "active:bg-selected"
                }`}
              >
                <Text className={`text-base ${active ? "text-accent-text" : "text-fg"}`}>
                  {item.label}
                </Text>
                {active && <Text className="text-accent-text">✓</Text>}
              </Pressable>
            );
          })}

          {/* Na escolha unica o proprio toque fecha a folha, entao um botao de
              terminar seria um passo a mais para nada. */}
          {props.multiple && (
            <Button variant="secondary" className="mt-3" onPress={() => setOpen(false)}>
              Concluir
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
