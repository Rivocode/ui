import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

function Chevron({ open }: { open: boolean }) {
  return (
    <View
      className={`size-2.5 border-r-2 border-b-2 border-fg-subtle ${
        open ? "-rotate-135" : "rotate-45"
      }`}
    />
  );
}

export type AccordionItemProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className={cn("border-b border-border", className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        className="min-h-12 flex-row items-center justify-between gap-3 py-3"
      >
        <Text className="flex-1 text-base font-medium text-fg">{title}</Text>
        <Chevron open={open} />
      </Pressable>
      {open && <View className="pb-4">{children}</View>}
    </View>
  );
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("border-t border-border", className)}>{children}</View>;
}

export type CollapsibleProps = {
  /** O rotulo do gatilho: "Ver os detalhes do calculo". */
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function Collapsible({ label, children, defaultOpen = false, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className={cn(className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        className="min-h-11 flex-row items-center gap-2 py-2"
      >
        <Chevron open={open} />
        <Text className="text-sm font-medium text-fg-muted">{label}</Text>
      </Pressable>
      {open && <View className="pt-1">{children}</View>}
    </View>
  );
}
