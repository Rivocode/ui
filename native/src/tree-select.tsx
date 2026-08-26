import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { summarize, type PickerItem } from "./picker";
import { Sheet } from "./sheet";
import { Tree, type TreeNode } from "./tree";

export type TreeSelectProps = {
  items: TreeNode[];
  /** Ids das FOLHAS escolhidas - o mesmo contrato do `Tree` e do web. */
  value: string[];
  onValueChange: (ids: string[]) => void;
  /** O que se escolhe: "Centro de custo". O leitor de tela anuncia isto. */
  label: string;
  /** O que o gatilho mostra sem escolha. */
  placeholder?: string;
  /** Ligada por padrao, como no web: arvore quase sempre se escolhe aos punhados. */
  multiple?: boolean;
  disabled?: boolean;
  /** Veste o gatilho; a folha e da plataforma. */
  className?: string;
};

/** As folhas da arvore, achatadas, para contar e nomear a escolha. */
function leafItems(items: TreeNode[]): PickerItem[] {
  return items.flatMap((node) =>
    node.children?.length ? leafItems(node.children) : [{ label: node.label, value: node.id }],
  );
}

/**
 * Escolha dentro de uma arvore: setor e equipe, categoria e subcategoria,
 * conta e centro de custo.
 *
 * E o `Tree` dentro da folha de baixo, com a mesma navegacao por niveis - e
 * por isso a peca resolve o que dois `Select` encadeados nunca resolveram: a
 * profundidade nao e fixa, e o segundo `Select` so sabia existir depois que
 * alguem escolhia no primeiro.
 *
 * **O rodape e a metade que o web nao precisa ter.** No desktop o painel fica
 * ao lado do gatilho, e o gatilho conta quantos foram. Sob uma folha nao ha
 * gatilho a vista, entao a contagem vive no rodape, junto do `Aplicar` - e ela
 * conta o RASCUNHO, que e o unico numero que responde "quantos eu ja marquei?"
 * enquanto a pessoa ainda esta marcando.
 *
 * **Sair pela lateral desiste**, e o `Aplicar` e a unica porta que confirma -
 * a mesma divisao do `DateRangePicker`: o toque no fundo escurecido e o gesto
 * de quem se arrependeu, e ele nao pode valer como aplicar. Quem marca doze
 * folhas e some com a folha nao muda nada na tela de tras.
 */
export function TreeSelect({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  multiple = true,
  disabled,
  className,
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const leaves = leafItems(items);

  /*
   * A conta e sempre sobre as folhas que EXISTEM na arvore de agora, e nunca
   * sobre a lista crua que chegou em `value` - a mesma regra do web. Id que
   * sobrou de uma arvore antiga contaria como escolha, e o gatilho diria "4
   * selecionados" apontando para tres linhas na tela.
   */
  const known = (ids: string[]) => ids.filter((id) => leaves.some((leaf) => leaf.value === id));

  // O MESMO `summarize` do Select e do Combobox, de proposito: as tres pecas
  // resumem escolha multipla, e a primeira que dissesse "12 escolhidos"
  // enquanto as outras dizem "12 selecionados" viraria defeito aparente de uma
  // das tres, sem ninguem descobrir qual.
  const summary = summarize(known(value), leaves);
  const draftSummary = summarize(known(draft), leaves);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary ?? placeholder }}
        disabled={disabled}
        onPress={() => {
          // O rascunho nasce do valor a cada abertura: sem isto, a folha que
          // alguem fechou pelo fundo reabria com as marcas que ela descartou.
          setDraft(value);
          setOpen(true);
        }}
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
        <View className="gap-3">
          <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
            <Tree
              items={items}
              value={draft}
              onValueChange={setDraft}
              multiple={multiple}
              label={label}
            />
          </ScrollView>

          {/* Fora da rolagem, como o "Concluir" do Combobox: com quatro niveis
              de arvore, um rodape que rolasse junto so apareceria para quem
              chegasse ao fim de um deles. */}
          <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
            <Text className="flex-1 text-sm text-fg-muted">
              {draftSummary ?? "Nada escolhido"}
            </Text>
            <Button
              onPress={() => {
                onValueChange(draft);
                setOpen(false);
              }}
            >
              Aplicar
            </Button>
          </View>
        </View>
      </Sheet>
    </>
  );
}
