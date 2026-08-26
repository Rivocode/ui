import { useState } from "react";
import { Pressable, Text, View, type AccessibilityActionEvent } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { Input } from "./field";

export type EditableProps = {
  /** O texto de agora. Controlado, como todo o resto do pacote nativo. */
  value: string;
  /** Avisado na confirmacao, e nunca no Cancelar. */
  onValueChange: (value: string) => void;
  /** O que o leitor de tela chama o campo, aberto ou fechado. */
  label: string;
  /** O que aparece no lugar do valor vazio. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/*
 * O toque longo tambem e uma acao de acessibilidade, e nao so um gesto.
 *
 * Quem usa VoiceOver ou TalkBack nao "segura o dedo" sobre um elemento: o
 * dedo ali e para ouvir o que ha embaixo. Sem esta acao declarada, a peca
 * ficava sem NENHUMA porta de entrada para essa pessoa - o texto era um botao
 * que nao respondia ao toque duplo. Declarada, ela aparece no rotor de acoes
 * com o nome escrito aqui.
 */
const EDIT_ACTIONS = [{ name: "longpress", label: "Editar" }];

/**
 * Edicao no lugar: o texto vira campo, e volta a ser texto ao ser confirmado.
 *
 * E o gesto que separa painel de leitura de painel de operacao. Corrigir o
 * nome de um cliente sem abrir outra tela, sem perder a posicao na lista e sem
 * esperar duas navegacoes e a diferenca entre a pessoa corrigir e a pessoa
 * deixar errado.
 *
 * **O que abre e o toque LONGO**, e nao o toque. E o gesto que o sistema ja
 * usa para agir sobre um texto - copiar, selecionar, traduzir -, e a escolha
 * e defensiva: num painel de leitura o dedo encosta em tudo enquanto rola, e
 * com o toque curto abrindo o campo, o teclado subia sozinho a cada esbarrao.
 *
 * **As duas saidas do web nao existem aqui, e por isso a peca desenha outras
 * duas:**
 *
 * O Escape vira um `Cancelar` visivel ao lado do campo. Sem tecla para
 * desistir, desistir precisa de alvo - e sem ele, o unico jeito de sair de uma
 * edicao aberta por engano seria salva-la.
 *
 * O "sair do campo salva" do web nao porta, e essa e a diferenca que mais
 * morde. No celular nao ha clicar fora: o que ha e o teclado que se esconde -
 * pelo botao de voltar do Android, pelo gesto, ou pelo proprio toque no
 * `Cancelar`, que TIRA o foco do campo antes de rodar. Com o `blur` salvando,
 * o botao de cancelar salvava o rascunho no caminho de cancela-lo. Entao o
 * `blur` nao faz nada: nada sai daqui sem uma confirmacao explicita - o botao
 * de retorno do teclado (`Concluir`) -, e nada se perde sem um `Cancelar`.
 */
export function Editable({
  value,
  onValueChange,
  label,
  placeholder = "—",
  disabled,
  className,
}: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function open() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft !== value) onValueChange(draft);
  }

  if (!editing) {
    return (
      <View className={cn("flex-row", className)}>
        <Pressable
          accessibilityRole="button"
          /* O valor viaja no nome: fechada, a peca e a unica coisa na linha
             que diz o que esta escrito, e "Nome do cliente" sozinho manda a
             pessoa abrir a edicao so para descobrir o que ha la dentro. */
          accessibilityLabel={`${label}: ${value || "vazio"}`}
          accessibilityHint="Toque e segure para editar"
          accessibilityActions={EDIT_ACTIONS}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === "longpress") open();
          }}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onLongPress={open}
          className={cn(
            "min-h-11 min-w-0 flex-1 justify-center rounded-sm px-2 active:bg-accent-subtle",
            disabled && "opacity-50",
          )}
        >
          {/* Uma linha, cortada no fim: o valor mora numa linha de painel, e
              deixa-lo crescer empurraria o resto da linha para fora da tela. */}
          <Text
            numberOfLines={1}
            className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}
          >
            {value || placeholder}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={cn("flex-row items-center gap-2", className)}>
      <Input
        accessibilityLabel={label}
        /* O teclado sobe junto com o campo, e o texto ja vem selecionado:
           quem abre para trocar o valor inteiro - o caso comum - digita por
           cima, e quem quer ajustar uma letra toca onde quer. */
        autoFocus
        selectTextOnFocus
        /* O retorno confirma, e o teclado precisa dizer isso ANTES: com o
           "enter" padrao a tecla parecia quebrar linha num campo de uma
           linha so. */
        returnKeyType="done"
        onSubmitEditing={commit}
        value={draft}
        onChangeText={setDraft}
        className="min-w-0 flex-1"
      />
      <Button variant="ghost" onPress={() => setEditing(false)}>
        Cancelar
      </Button>
    </View>
  );
}
