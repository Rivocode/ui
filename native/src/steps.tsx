import { useCallback, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

import { cn } from "./cn";

export type Step = {
  id: string;
  title: string;
  description?: string;
};

export type StepsProps = {
  steps: Step[];
  /** Índice do passo atual, contando de zero. */
  current: number;
  className?: string;
};

/** O passo atual conta como andado: no primeiro de quatro a barra já mostra um quarto. */
const percent = (index: number, total: number) => ((index + 1) / total) * 100;

/**
 * A régua de passos de um formulário longo.
 *
 * O web desenha duas: a fila de bolinhas com rótulo, e — abaixo de 640px — uma
 * linha de texto com a barra de progresso. **Só a segunda porta**, e não por
 * falta de trabalho: a régua horizontal já foi medida lá e não cabe em 390px.
 * Cinco passos numa faixa dessas dão 60px de rótulo por passo, e "Conferir os
 * itens" vira "Confe…" cinco vezes seguidas. O que a pessoa precisa saber num
 * assistente de celular é onde está e quanto falta, e isso é exatamente o que
 * a linha com a barra diz.
 *
 * Por isso também não existe `onStepClick` aqui. No web ele só vive na régua
 * larga — o modo estreito de lá nunca teve passo clicável —, e sem bolinha não
 * há o que tocar. Voltar é o botão do `WizardFooter` (e o back do Android);
 * pular passo continua sendo `useWizard().goTo`, chamado pela tela.
 *
 * A descrição, que o modo estreito do web esconde por falta de largura,
 * aparece: aqui o passo atual é o único na tela e ocupa a linha inteira.
 */
export function Steps({ steps, current, className }: StepsProps) {
  if (steps.length === 0) return null;

  const index = Math.min(Math.max(current, 0), steps.length - 1);
  const step = steps[index]!;
  const position = `Passo ${index + 1} de ${steps.length}`;

  return (
    // Uma parada só do leitor de tela, e não quatro: "Passo 2 de 4: Itens" é
    // uma frase, e quebrada em três elementos ela é lida como três fatos
    // soltos, com a barra de progresso repetindo o que os dois textos acima já
    // disseram.
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${position}: ${step.title}`}
      accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
      className={cn("gap-2", className)}
    >
      <Text className="text-sm text-fg-muted">{position}</Text>
      <Text className="text-lg font-semibold text-fg">{step.title}</Text>
      {step.description !== undefined && (
        <Text className="text-sm text-fg-muted">{step.description}</Text>
      )}

      <View className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-skeleton">
        <View
          className="h-full rounded-pill bg-accent"
          style={{ width: `${percent(index, steps.length)}%` }}
        />
      </View>
    </View>
  );
}

export type WizardState = {
  step: number;
  current: Step | undefined;
  isFirst: boolean;
  isLast: boolean;
  /**
   * Avança. Recebe uma checagem opcional que pode ser assíncrona: devolva
   * `false` e o passo não anda. É por aqui que entra o `trigger` do React Hook
   * Form, sem o assistente conhecer o React Hook Form.
   */
  next: (validate?: () => boolean | Promise<boolean>) => Promise<boolean>;
  back: () => void;
  goTo: (index: number) => void;
};

/**
 * O estado de um formulário em etapas, **igual ao do web, linha por linha**.
 *
 * Ele atravessa porque não é desenho: é `useState` e três contas de índice,
 * sem DOM, sem foco e sem media query. Deixar o passo para o router nativo
 * seria trocar um estado de tela por cinco rotas — e um assistente não é
 * navegação: os passos partilham um formulário só, o back do aparelho não pode
 * perder o que já foi digitado, e "Conferir" não é um endereço que alguém
 * deva abrir direto.
 *
 * Quem quiser uma rota por passo continua podendo: `goTo` aceita o índice que
 * o router mandar.
 */
export function useWizard(steps: Step[], initial = 0): WizardState {
  const [step, setStep] = useState(initial);

  const next = useCallback(
    async (validate?: () => boolean | Promise<boolean>) => {
      if (validate && !(await validate())) return false;
      setStep((previous) => Math.min(previous + 1, steps.length - 1));
      return true;
    },
    [steps.length],
  );

  const back = useCallback(() => setStep((previous) => Math.max(previous - 1, 0)), []);

  const goTo = useCallback(
    (index: number) => setStep(Math.min(Math.max(index, 0), steps.length - 1)),
    [steps.length],
  );

  return {
    step,
    current: steps[step],
    isFirst: step === 0,
    isLast: step === steps.length - 1,
    next,
    back,
    goTo,
  };
}

export type WizardFooterProps = {
  children: ReactNode;
  className?: string;
};

/**
 * O rodapé de um assistente: os botões empilhados, largura toda, na ordem em
 * que foram escritos — voltar em cima, avançar embaixo, onde o polegar está.
 *
 * No web ele é uma linha que só empilha abaixo de 640px, e o `w-full` de cada
 * botão chega por seletor de filho. Aqui não há seletor de filho e também não
 * é preciso: o `alignItems: stretch` é o padrão do React Native, e ele já
 * estica cada botão na largura da coluna.
 */
export function WizardFooter({ children, className }: WizardFooterProps) {
  return <View className={cn("mt-6 gap-3", className)}>{children}</View>;
}
