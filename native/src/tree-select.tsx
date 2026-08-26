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
}: TreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const leaves = leafItems(items);

  const known = (ids: string[]) => ids.filter((id) => leaves.some((leaf) => leaf.value === id));

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
