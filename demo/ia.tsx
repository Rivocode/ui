import { MessageSquare, Paperclip } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconButton,
  Questionnaire,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireFooter,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  type QuestionnaireAnswers,
  RivoProvider,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";
import { AILabel, Conversation, Message, PromptInput, ToolCall } from "../src/ai/index";

const ANSWER =
  "Em agosto foram emitidas 42 notas, somando R$ 48.200,00. Três ainda estão em aberto, e a maior delas vence na sexta.";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

const bot = <Avatar size="sm" fallback="R" />;

function Chat() {
  const [streaming, setStreaming] = useState(true);

  return (
    <div className="flex h-[36rem] flex-col gap-3">
      <Conversation className="flex-1">
        <Message role="system">Conversa iniciada às 14h02.</Message>
        <Message role="user">Quanto faturei em agosto?</Message>
        <Message role="assistant" avatar={bot} copyValue={ANSWER} onRetry={() => {}}>
          {ANSWER}
        </Message>
        <Message role="user">Emita a nota da Clínica São Lucas.</Message>
        <ToolCall
          name="emitir_nota"
          title="Emitir a nota da Clínica São Lucas"
          status="approval"
          input={{ cliente: "Clínica São Lucas", servico: "01.07", valor: 3400 }}
          onApprove={() => {}}
          onReject={() => {}}
        />
        <Message role="assistant" avatar={bot} streaming={streaming}>
          Aguardo a sua aprovação para emitir
        </Message>
      </Conversation>
      <PromptInput
        streaming={streaming}
        onSubmit={() => setStreaming(true)}
        onStop={() => setStreaming(false)}
        showCount
        maxLength={4000}
        actions={
          <IconButton label="Anexar arquivo" variant="ghost" size="sm">
            <Paperclip />
          </IconButton>
        }
      />
    </div>
  );
}

function Tools() {
  return (
    <div className="flex flex-col gap-3">
      <ToolCall name="buscar_notas" title="Consultando as notas de agosto" status="pending" />
      <ToolCall name="buscar_notas" title="Consultando as notas de agosto" status="running" />
      <ToolCall
        name="buscar_notas"
        title="Consultando as notas de agosto"
        status="done"
        input={{ mes: 8, ano: 2026 }}
        output={{ total: 3, valor: 5330 }}
        defaultOpen
      />
      <ToolCall
        name="consultar_prefeitura"
        title="Conferindo o código de serviço"
        status="error"
        input={{ codigo: "01.07" }}
        error="A prefeitura de João Pessoa não respondeu em 30 segundos."
      />
    </div>
  );
}

function Messages() {
  return (
    <div className="flex flex-col gap-6">
      <Message role="assistant" avatar={bot} streaming />
      <Message
        role="assistant"
        avatar={bot}
        error="A resposta foi interrompida. Tente de novo."
        onRetry={() => {}}
      >
        Em agosto foram emitidas
      </Message>
      <Message role="user" avatar={<Avatar size="sm" fallback="A" />}>
        Uma pergunta bem mais longa, para ver o balão quebrar a linha antes da borda e continuar
        alinhado à direita, sem encostar no avatar.
      </Message>
    </div>
  );
}

function Prompts() {
  return (
    <div className="flex flex-col gap-3">
      <PromptInput placeholder="Pergunte sobre as notas desta conta" />
      <PromptInput
        defaultValue="Resuma a nota em anexo em três linhas."
        showCount
        maxLength={38}
        attachments={
          <span className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-fg-muted">
            nota-agosto.pdf
          </span>
        }
      />
      <PromptInput disabled placeholder="O assistente está fora do ar até as 14h" />
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-80 flex-col rounded-lg border border-border">
      <Conversation
        className="flex-1"
        empty={{
          icon: <MessageSquare />,
          title: "Pergunte sobre as suas notas",
          description: "O assistente lê as notas emitidas nesta conta, e nada além delas.",
          suggestions: ["Quanto faturei em agosto?", "Quais notas vencem esta semana?"],
        }}
        onSuggestion={() => {}}
      />
    </div>
  );
}

function Labels() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AILabel />
        <AILabel tone="neutral" />
        <AILabel size="md" />
      </div>
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Resumo de agosto</CardTitle>
            <AILabel explanation="Escrito pelo assistente a partir das 42 notas de agosto. Confira os valores antes de enviar ao contador." />
          </div>
        </CardHeader>
        <CardContent className="text-sm text-fg-muted">
          O faturamento subiu 12% sobre julho, puxado pelos serviços de consultoria.
        </CardContent>
      </Card>
    </div>
  );
}

function Clarify() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Message role="user">Emita a nota de setembro da Clínica São Lucas.</Message>
      <ToolCall
        name="pedir_esclarecimento"
        title="Preciso de três respostas antes de emitir"
        status={answers ? "done" : "approval"}
        output={answers ?? undefined}
      />
      {answers ? (
        <button
          type="button"
          className="self-start text-sm text-fg-muted underline"
          onClick={() => setAnswers(null)}
        >
          Recomeçar
        </button>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-4">
          <Questionnaire aria-label="Esclarecimento" onSubmit={(sent) => setAnswers(sent)}>
            <QuestionnaireProgress />
            <QuestionnaireItem name="servico" required>
              <QuestionnaireTitle>Qual serviço entra nesta nota?</QuestionnaireTitle>
              <QuestionnaireDescription>
                O código sai da lista da prefeitura.
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="01.07" description="Código 01.07">
                  Suporte técnico
                </QuestionnaireChoice>
                <QuestionnaireChoice value="17.01" description="Código 17.01" defaultChecked>
                  Consultoria
                </QuestionnaireChoice>
                <QuestionnaireChoice value="01.03" description="Código 01.03" disabled>
                  Hospedagem (fora do contrato)
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>
            <QuestionnaireItem name="envio" multiple>
              <QuestionnaireTitle>Por onde a nota chega à clínica?</QuestionnaireTitle>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="email">E-mail</QuestionnaireChoice>
                <QuestionnaireChoice value="whatsapp">WhatsApp</QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireInput placeholder="Outro canal" />
              <QuestionnaireError />
            </QuestionnaireItem>
            <QuestionnaireItem name="observacao">
              <QuestionnaireTitle>Algo que a nota deve dizer?</QuestionnaireTitle>
              <QuestionnaireInput placeholder="Ex.: número do contrato" />
              <QuestionnaireError />
            </QuestionnaireItem>
            <QuestionnaireFooter>
              <QuestionnairePrevious />
              <QuestionnaireSkip />
              <QuestionnaireNext />
              <QuestionnaireSubmit>Responder ao agente</QuestionnaireSubmit>
            </QuestionnaireFooter>
          </Questionnaire>
        </div>
      )}
    </div>
  );
}

function QuestionnaireStates() {
  const failing = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => failing.current?.requestSubmit(), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Questionnaire aria-label="Com erro" ref={failing} shortcuts="numbers">
        <QuestionnaireItem name="assina" required>
          <QuestionnaireTitle>Quem assina o pedido de emissão?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="socio">O sócio administrador</QuestionnaireChoice>
            <QuestionnaireChoice value="contador">O contador</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireFooter>
          <QuestionnaireSubmit>Enviar</QuestionnaireSubmit>
        </QuestionnaireFooter>
      </Questionnaire>

      <Questionnaire aria-label="Desabilitada">
        <QuestionnaireItem name="certificado" disabled>
          <QuestionnaireTitle>Qual certificado assina as notas?</QuestionnaireTitle>
          <QuestionnaireDescription>Libera depois que o A1 for enviado.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="a1">Certificado A1</QuestionnaireChoice>
            <QuestionnaireChoice value="a3">Certificado A3</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>
    </div>
  );
}

function Sample({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Block title="Conversation">
          <Chat />
        </Block>

        <div className="flex flex-col gap-12">
          <Block title="ToolCall">
            <Tools />
          </Block>

          <Block title="AILabel">
            <Labels />
          </Block>
        </div>

        <Block title="Message">
          <Messages />
        </Block>

        <Block title="PromptInput">
          <Prompts />
        </Block>

        <Block title="Conversa vazia">
          <Empty />
        </Block>

        <Block title="Questionnaire">
          <Clarify />
        </Block>

        <Block title="Questionnaire: erro e desabilitada">
          <QuestionnaireStates />
        </Block>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" density="comfortable" />
    <Sample theme="rivocode-light" density="compact" />
    <Sample theme="rivocode-dark" density="compact" />
    <Sample theme="rivocode-light" density="comfortable" />
  </div>,
);
