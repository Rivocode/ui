import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Checkbox } from "./checkbox";
import { cn } from "./cn";

export type TreeNode = {
  id: string;
  /**
   * O nome na linha: "Contas a pagar".
   *
   * `string`, e nao o `ReactNode` do web, e a razao e a mesma do `at` do
   * `Timeline`: este texto e montado dentro do rotulo falado da linha e dentro
   * do caminho do cabecalho, e de um `ReactNode` nao ha como ler o texto de
   * volta - o galho sairia anunciado como "objeto, 4 itens".
   */
  label: string;
  /** Sem filhos - ou com a lista vazia - o no e folha, e folha e quem vale. */
  children?: TreeNode[];
  disabled?: boolean;
};

export type TreeProps = {
  items: TreeNode[];
  /** Ids das FOLHAS marcadas. Pai marcado nao entra aqui. */
  value: string[];
  onValueChange: (ids: string[]) => void;
  /** Sem isto, so uma folha por vez e nenhum galho se marca. */
  multiple?: boolean;
  /**
   * O nome do nivel de cima: "Centro de custo". E ele que o leitor de tela
   * anuncia na lista da raiz, e e para ele que o "Voltar" do segundo nivel
   * aponta.
   */
  label: string;
  /** O que dizer quando um nivel nao tem nada dentro. */
  emptyMessage?: string;
  className?: string;
};

/** Todas as folhas debaixo de um no. Um no sem filhos e a propria folha. */
export function leavesOf(node: TreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(leavesOf);
}

/**
 * Os nos do caminho, ate onde os ids ainda existirem na arvore de agora.
 *
 * O caminho e guardado por id, e nao pelos nos que foram tocados: `items`
 * costuma vir de uma consulta que se refaz, e cada resposta traz objetos
 * novos. Guardando os nos, a pessoa ficava olhando o nivel de dentro da
 * resposta ANTERIOR - a tela nao mudava, os numeros do rodape sim, e nada na
 * tela dizia por que. Sumindo o galho, o caminho encurta ate onde ainda vale.
 */
function trailOf(items: TreeNode[], ids: string[]): TreeNode[] {
  const trail: TreeNode[] = [];
  let level = items;

  for (const id of ids) {
    const node = level.find((candidate) => candidate.id === id);
    if (!node?.children?.length) break;
    trail.push(node);
    level = node.children;
  }

  return trail;
}

/** O chevron desenhado com borda, nunca glyph: fonte muda de corpo, traco nao. */
function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <View
      className={`size-2.5 border-r-2 border-b-2 border-fg-subtle ${
        direction === "right" ? "-rotate-45" : "rotate-135"
      }`}
    />
  );
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/** "Financeiro, 4 itens, 2 escolhidos" - o galho inteiro numa frase. */
function describeBranch(node: TreeNode, total: number, chosen: number, multiple?: boolean) {
  const parts = [node.label, plural(total, "item", "itens")];
  if (multiple && chosen > 0) parts.push(plural(chosen, "escolhido", "escolhidos"));
  return parts.join(", ");
}

/**
 * Arvore de escolha, empilhada em niveis.
 *
 * A regra que organiza tudo e a mesma do web: **quem vale e a folha**. Marcar
 * um galho marca todas as folhas debaixo dele, e o que sai em `onValueChange`
 * e sempre uma lista de folhas - guardar o pai junto criaria dois jeitos de
 * dizer a mesma coisa, e quem consome teria que descobrir se "financeiro" quer
 * dizer o setor ou todo mundo dentro dele.
 *
 * **O desenho, esse, nao porta.** No web a arvore mostra os niveis abertos ao
 * mesmo tempo, um recuo por nivel. A 390px o terceiro nivel comeca depois do
 * meio da tela e o nome do no cabe em quatro letras - a peca fica ilegivel
 * justamente onde ela e mais util. Aqui **um nivel por vez**: tocar num galho
 * empurra o nivel de dentro, e o cabecalho mostra o caminho e volta um nivel.
 * E a navegacao que o proprio sistema usa para hierarquia em tela estreita.
 *
 * Duas consequencias do empilhamento, e as duas sao de proposito:
 *
 * **O galho tem dois alvos, e nao um.** Tocar no nome ENTRA; a caixa ao lado
 * marca o galho inteiro. Com um alvo so nao havia como marcar "Financeiro"
 * sem visitar as sete folhas de dentro, que e o gesto que a peca existe para
 * poupar.
 *
 * **Nao ha estado misto na caixa**, porque o `Checkbox` nativo nao tem: o
 * galho meio marcado aparece com a caixa vazia e um "2 de 7 escolhidos"
 * embaixo do nome - texto, que se le e se ouve, no lugar de um tracinho que
 * so se ve.
 *
 * Sem busca, e isso e decisao: buscar dentro de arvore achata os niveis, e
 * lista achatada com busca ja e o `Combobox`.
 */
export function Tree({
  items,
  value,
  onValueChange,
  multiple,
  label,
  emptyMessage = "Nada dentro deste nível.",
  className,
}: TreeProps) {
  const [pathIds, setPathIds] = useState<string[]>([]);

  const trail = trailOf(items, pathIds);
  const here = trail.length > 0 ? (trail[trail.length - 1]!.children ?? []) : items;
  // O nome do nivel onde o dedo esta: o da raiz na primeira tela, o do galho
  // dali para dentro.
  const levelName = trail.length > 0 ? trail[trail.length - 1]!.label : label;
  const backName = trail.length > 1 ? trail[trail.length - 2]!.label : label;

  function enter(node: TreeNode) {
    setPathIds([...trail.map((step) => step.id), node.id]);
  }

  function back() {
    setPathIds(trail.slice(0, -1).map((step) => step.id));
  }

  function toggle(node: TreeNode) {
    const leaves = leavesOf(node);

    if (!multiple) {
      // Sem multipla, so folha escolhe, e a escolha troca em vez de somar.
      if (node.children?.length) return;
      onValueChange(value.includes(node.id) ? [] : [node.id]);
      return;
    }

    const all = leaves.every((leaf) => value.includes(leaf));
    const rest = value.filter((id) => !leaves.includes(id));
    onValueChange(all ? rest : [...rest, ...leaves]);
  }

  return (
    <View className={cn("gap-1", className)}>
      {trail.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voltar para ${backName}`}
          onPress={back}
          className="min-h-12 flex-row items-center gap-2.5 rounded-md px-3 active:bg-selected"
        >
          <Chevron direction="left" />
          {/*
           * O corte e pela FRENTE (`head`), e nao pelo fim.
           * "Financeiro › Contas a pagar › Fornecedores" nao cabe a 390px, e o
           * pedaco que importa e o ultimo: o nivel onde o dedo esta. Cortando
           * pelo fim, tres caminhos diferentes viram a mesma linha na tela.
           */}
          <Text
            numberOfLines={1}
            ellipsizeMode="head"
            className="flex-1 text-sm text-fg-muted"
          >
            {trail.map((step) => step.label).join(" › ")}
          </Text>
        </Pressable>
      )}

      {/* O papel e o rotulo mudam com o nivel: o leitor de tela precisa saber
          que a lista debaixo do dedo passou a ser outra. */}
      <View accessibilityRole="list" accessibilityLabel={levelName} className="gap-1">
        {here.length === 0 && (
          <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
        )}

        {here.map((node) => {
          const branch = Boolean(node.children?.length);
          const leaves = leavesOf(node);
          const chosen = leaves.filter((leaf) => value.includes(leaf)).length;
          const full = chosen > 0 && chosen === leaves.length;

          if (branch) {
            return (
              <View key={node.id} className="flex-row items-center gap-2.5">
                {multiple && (
                  <Checkbox
                    accessibilityLabel={`Marcar tudo em ${node.label}`}
                    /* A caixa desenha 20px e aqui ela e vizinha de um alvo que
                       ocupa o resto da linha - sem a folga, quem mira nela
                       entra no nivel por engano. */
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 6 }}
                    checked={full}
                    disabled={node.disabled}
                    onCheckedChange={() => toggle(node)}
                    className="pl-3"
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={describeBranch(node, leaves.length, chosen, multiple)}
                  accessibilityHint="Abre o nível de dentro"
                  accessibilityState={{ disabled: node.disabled }}
                  disabled={node.disabled}
                  onPress={() => enter(node)}
                  className={`min-h-12 flex-1 flex-row items-center gap-3 rounded-md pr-3 ${
                    multiple ? "" : "pl-3"
                  } ${node.disabled ? "opacity-50" : "active:bg-selected"}`}
                >
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-base text-fg">
                      {node.label}
                    </Text>
                    {multiple && chosen > 0 && !full && (
                      <Text className="text-xs text-fg-subtle">
                        {chosen} de {leaves.length} escolhidos
                      </Text>
                    )}
                  </View>
                  <Chevron direction="right" />
                </Pressable>
              </View>
            );
          }

          if (multiple) {
            return (
              <Checkbox
                key={node.id}
                checked={full}
                disabled={node.disabled}
                onCheckedChange={() => toggle(node)}
                className="min-h-12 rounded-md px-3 active:bg-selected"
              >
                {node.label}
              </Checkbox>
            );
          }

          return (
            <Pressable
              key={node.id}
              /* O papel segue o gesto, como no Select: escolha unica decide, e
                 decidir e botao. */
              accessibilityRole="button"
              accessibilityState={{ selected: full, disabled: node.disabled }}
              disabled={node.disabled}
              onPress={() => toggle(node)}
              className={`min-h-12 flex-row items-center justify-between gap-3 rounded-md px-3 ${
                node.disabled ? "opacity-50" : full ? "bg-accent-subtle" : "active:bg-selected"
              }`}
            >
              <Text className={`flex-1 text-base ${full ? "text-accent-text" : "text-fg"}`}>
                {node.label}
              </Text>
              {full && <Text className="text-accent-text">✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
