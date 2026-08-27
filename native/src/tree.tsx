import { useState } from "react";
import { Pressable, View } from "react-native";

import { Checkbox } from "./checkbox";
import { cn } from "./cn";
import { Text } from "./text";

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

export function leavesOf(node: TreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(leavesOf);
}

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

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <View
      className={`size-2.5 border-r-2 border-b-2 border-fg-subtle ${
        direction === "right" ? "-rotate-45" : "rotate-135"
      }`}
    />
  );
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function describeBranch(node: TreeNode, total: number, chosen: number, multiple?: boolean) {
  const parts = [node.label, plural(total, "item", "itens")];
  if (multiple && chosen > 0) parts.push(plural(chosen, "escolhido", "escolhidos"));
  return parts.join(", ");
}

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
          <Text numberOfLines={1} ellipsizeMode="head" className="flex-1 text-sm text-fg-muted">
            {trail.map((step) => step.label).join(" › ")}
          </Text>
        </Pressable>
      )}

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
