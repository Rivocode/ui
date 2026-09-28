import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { PICKER_LABELS, summarize, type PickerItem } from "./picker";
import { Sheet } from "./sheet";
import { Text } from "./text";
import { Tree, type TreeLabels, type TreeNode } from "./tree";

export type TreeSelectProps = {
  items: TreeNode[];
  /** Ids of the chosen LEAVES - the same contract as `Tree` and the web. */
  value: string[];
  onValueChange: (ids: string[]) => void;
  /** What is being chosen: "Centro de custo". The screen reader announces this. */
  label: string;
  /** What the trigger shows with no choice. */
  placeholder?: string;
  /** On by default, as on the web: a tree is almost always chosen by the handful. */
  multiple?: boolean;
  disabled?: boolean;
  /** Styles the trigger; the sheet belongs to the platform. */
  className?: string;
  /**
   * The component's texts, to change the language: `selected` is the summary
   * with more than one choice, `empty` the sheet footer with no choice at all
   * and `apply` the confirm button. `back`, `selectAll`, `branch` and `enter`
   * go to the inner `Tree`. Pass only the ones that change.
   */
  labels?: Partial<TreeSelectLabels>;
};

export type TreeSelectLabels = TreeLabels & {
  selected: (count: number) => string;
  empty: string;
  apply: string;
};

const LABELS = {
  selected: PICKER_LABELS.selected,
  empty: "Nada escolhido",
  apply: "Aplicar",
};

function leafItems(items: TreeNode[]): PickerItem[] {
  return items.flatMap((node) =>
    node.children?.length ? leafItems(node.children) : [{ label: node.label, value: node.id }],
  );
}

export function TreeSelect({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  multiple = true,
  disabled,
  className,
  labels: labelsProp,
}: TreeSelectProps) {
  const labels = { ...LABELS, ...labelsProp };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const leaves = leafItems(items);

  const known = (ids: string[]) => ids.filter((id) => leaves.some((leaf) => leaf.value === id));

  const summary = summarize(known(value), leaves, labels.selected);
  const draftSummary = summarize(known(draft), leaves, labels.selected);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary ?? placeholder }}
        disabled={disabled}
        onPress={() => {
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
        <View className="shrink gap-3">
          <ScrollView className="max-h-80 shrink" keyboardShouldPersistTaps="handled">
            <Tree
              items={items}
              value={draft}
              onValueChange={setDraft}
              multiple={multiple}
              label={label}
              labels={labelsProp}
            />
          </ScrollView>

          <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
            <Text className="flex-1 text-sm text-fg-muted">{draftSummary ?? labels.empty}</Text>
            <Button
              onPress={() => {
                onValueChange(draft);
                setOpen(false);
              }}
            >
              {labels.apply}
            </Button>
          </View>
        </View>
      </Sheet>
    </>
  );
}
