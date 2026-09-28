import { useState } from "react";
import { Pressable, View } from "react-native";

import { Checkbox } from "./checkbox";
import { cn } from "./cn";
import { Presence } from "./motion";
import { Text } from "./text";

export type TreeNode = {
  id: string;
  /**
   * The name on the row: "Contas a pagar". `string`, and not the web
   * `ReactNode`, for the same reason as the `Timeline` `at`: this text is built
   * into the row's spoken label and into the header path, and there is no way
   * to read text back out of a `ReactNode` - the branch would be announced as
   * "object, 4 items".
   */
  label: string;
  /** Without children - or with an empty list - the node is a leaf, and leaves are what count. */
  children?: TreeNode[];
  disabled?: boolean;
};

export type TreeProps = {
  items: TreeNode[];
  /** Ids of the checked LEAVES. A checked parent does not go here. */
  value: string[];
  onValueChange: (ids: string[]) => void;
  /** Without it, only one leaf at a time and no branch gets checked. */
  multiple?: boolean;
  /**
   * The name of the top level: "Centro de custo". It is what the screen reader
   * announces on the root list, and it is what "Voltar" on the second level
   * points to.
   */
  label: string;
  /** What to say when a level has nothing inside. */
  emptyMessage?: string;
  className?: string;
  /**
   * The component's texts, to change the language: `back` is the name of the
   * button that goes up a level, and receives the name of the level above;
   * `selectAll` that of the box that checks a whole branch; `branch` what the
   * screen reader hears on a branch, with the total of leaves and how many are
   * chosen; and `enter` its hint. Pass only the ones that change.
   */
  labels?: Partial<TreeLabels>;
};

export type TreeLabels = {
  back: (name: string) => string;
  selectAll: (name: string) => string;
  branch: (name: string, total: number, chosen: number) => string;
  enter: string;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const LABELS: TreeLabels = {
  back: (name) => `Voltar para ${name}`,
  selectAll: (name) => `Marcar tudo em ${name}`,
  branch: (name, total, chosen) => {
    const parts = [name, plural(total, "item", "itens")];
    if (chosen > 0) parts.push(plural(chosen, "escolhido", "escolhidos"));
    return parts.join(", ");
  },
  enter: "Abre o nível de dentro",
};

export function leavesOf(node: TreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(leavesOf);
}

function openLeavesOf(node: TreeNode): string[] {
  if (node.disabled) return [];
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(openLeavesOf);
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

export function Tree({
  items,
  value,
  onValueChange,
  multiple,
  label,
  emptyMessage = "Nada dentro deste nível.",
  className,
  labels: labelsProp,
}: TreeProps) {
  const labels = { ...LABELS, ...labelsProp };
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
    if (!multiple) {
      if (node.children?.length) return;
      onValueChange(value.includes(node.id) ? [] : [node.id]);
      return;
    }

    const open = openLeavesOf(node);
    if (open.length === 0) return;
    const all = open.every((leaf) => value.includes(leaf));
    const rest = value.filter((id) => !open.includes(id));
    onValueChange(all ? rest : [...rest, ...open]);
  }

  return (
    <View className={cn("gap-1", className)}>
      {trail.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.back(backName)}
          onPress={back}
          className="min-h-12 flex-row items-center gap-2.5 rounded-md px-3 active:bg-selected"
        >
          <Chevron direction="left" />
          <Text numberOfLines={1} ellipsizeMode="head" className="flex-1 text-sm text-fg-muted">
            {trail.map((step) => step.label).join(" › ")}
          </Text>
        </Pressable>
      )}

      <Presence swapKey={trail.map((step) => step.id).join("/")} exit="none">
        <View accessibilityRole="list" accessibilityLabel={levelName} className="gap-1">
          {here.length === 0 && (
            <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
          )}

          {here.map((node) => {
            const branch = Boolean(node.children?.length);
            const leaves = leavesOf(node);
            const chosen = leaves.filter((leaf) => value.includes(leaf)).length;
            const full = chosen > 0 && chosen === leaves.length;
            const mixed = chosen > 0 && !full;

            if (branch) {
              return (
                <View key={node.id} className="flex-row items-center gap-2.5">
                  {multiple && (
                    <Checkbox
                      label={labels.selectAll(node.label)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 6 }}
                      checked={full}
                      indeterminate={mixed}
                      disabled={node.disabled}
                      onCheckedChange={() => toggle(node)}
                      className="pl-3"
                    />
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={labels.branch(
                      node.label,
                      leaves.length,
                      multiple ? chosen : 0,
                    )}
                    accessibilityHint={labels.enter}
                    accessibilityState={{ disabled: node.disabled }}
                    disabled={node.disabled}
                    onPress={() => enter(node)}
                    className={`min-h-12 flex-1 flex-row items-center gap-3 rounded-md pr-3 ${
                      multiple ? "" : "pl-3"
                    } ${node.disabled ? "opacity-50" : "active:bg-selected"}`}
                  >
                    <Text numberOfLines={1} className="flex-1 text-base text-fg">
                      {node.label}
                    </Text>
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
      </Presence>
    </View>
  );
}
