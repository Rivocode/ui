import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

/** O chevron desenhado com borda, apontando para onde o painel vai. */
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
};

/**
 * Um item do acordeao, dono do proprio aberto-ou-fechado: perguntas
 * frequentes, detalhes que nao precisam todos abertos ao mesmo tempo.
 */
export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="border-b border-border">
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

/** A pilha de AccordionItem, com a borda de cima que fecha a moldura. */
export function Accordion({ children }: { children: ReactNode }) {
  return <View className="border-t border-border">{children}</View>;
}

export type CollapsibleProps = {
  /** O rotulo do gatilho: "Ver os detalhes do calculo". */
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Um unico mostra-esconde, sem moldura - o irmao solto do acordeao. */
export function Collapsible({ label, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View>
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
