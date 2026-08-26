import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { cn } from "./cn";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Veste o painel da folha, nao o fundo escurecido. */
  className?: string;
};

/**
 * A folha que encosta embaixo - o comportamento estreito do web e o unico
 * que existe aqui. Modal nativo por baixo: foco, back do Android e o gesto
 * de fechar vem da plataforma.
 */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      {/* accessibilityViewIsModal prende o leitor de tela na folha; sem ele o
          VoiceOver segue lendo a tela que ficou atras. */}
      <View accessibilityViewIsModal className="flex-1 justify-end">
        {/* O fundo escurece e fecha no toque, como o overlay do web - e e IRMA
            do painel, nao mae dele: embrulhando a folha inteira, ela virava um
            botao "Fechar" gigante e sem papel, a primeira e maior parada do
            leitor de tela. Fora do caminho, o stopPropagation nao serve mais. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="absolute inset-0 bg-overlay"
          onPress={() => onOpenChange(false)}
        />
        <View className={cn("rounded-t-xl border-t border-border bg-surface px-5 pt-3 pb-8", className)}>
          <View className="mb-4 h-1 w-10 self-center rounded-pill bg-border-strong" />
          <Text accessibilityRole="header" className="text-xl font-semibold text-fg">
            {title}
          </Text>
          {description && <Text className="mt-1 text-sm text-fg-muted">{description}</Text>}
          {children && <View className="mt-4">{children}</View>}
        </View>
      </View>
    </Modal>
  );
}
