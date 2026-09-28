import {
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
} from '@rivocode/ui'
import { Message, ToolCall } from '@rivocode/ui/ai'
import { useState } from 'react'

/** Onboarding, uma pergunta por vez */
export function Onboarding() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null)

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <Questionnaire aria-label="Configurar a emissão" onSubmit={(sent) => setAnswers(sent)}>
        <QuestionnaireProgress />

        <QuestionnaireItem name="regime" required>
          <QuestionnaireTitle>Qual é o regime tributário da empresa?</QuestionnaireTitle>
          <QuestionnaireDescription>Está no cartão do CNPJ, na Receita.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="simples">Simples Nacional</QuestionnaireChoice>
            <QuestionnaireChoice value="presumido">Lucro Presumido</QuestionnaireChoice>
            <QuestionnaireChoice value="real">Lucro Real</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name="envio" multiple>
          <QuestionnaireTitle>Por onde a nota chega ao cliente?</QuestionnaireTitle>
          <QuestionnaireDescription>Marque quantos quiser.</QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="email">E-mail</QuestionnaireChoice>
            <QuestionnaireChoice value="whatsapp">WhatsApp</QuestionnaireChoice>
            <QuestionnaireChoice value="portal" description="O cliente baixa quando quiser">
              Portal do cliente
            </QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireInput placeholder="Outro canal" />
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireItem name="observacao">
          <QuestionnaireTitle>Algo que a nota deve sempre dizer?</QuestionnaireTitle>
          <QuestionnaireInput placeholder="Ex.: número do contrato" />
          <QuestionnaireError />
        </QuestionnaireItem>

        <QuestionnaireFooter>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireFooter>
      </Questionnaire>

      {answers && (
        <pre className="rounded-md border border-border bg-surface-raised p-3 font-mono text-xs text-fg-muted">
          {JSON.stringify(answers, null, 2)}
        </pre>
      )}
    </div>
  )
}

/** O agente pergunta, a pessoa responde */
export function AgentAsks() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null)

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Message role="user">Emita a nota de setembro da Clínica São Lucas.</Message>
      <ToolCall
        name="pedir_esclarecimento"
        title="Preciso de duas respostas antes de emitir"
        status={answers ? 'done' : 'approval'}
        input={{ perguntas: ['servico', 'retencao'] }}
        output={answers ?? undefined}
      />
      {!answers && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <Questionnaire
            aria-label="Esclarecimento para emitir a nota"
            shortcuts="numbers"
            onSubmit={(sent) => setAnswers(sent)}
          >
            <QuestionnaireProgress />

            <QuestionnaireItem name="servico" required>
              <QuestionnaireTitle>Qual serviço entra nesta nota?</QuestionnaireTitle>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="01.07" description="Código 01.07">
                  Suporte técnico
                </QuestionnaireChoice>
                <QuestionnaireChoice value="17.01" description="Código 17.01">
                  Consultoria
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name="retencao" required>
              <QuestionnaireTitle>A clínica retém o ISS?</QuestionnaireTitle>
              <QuestionnaireDescription>
                Está no contrato; na dúvida, confira com o financeiro dela.
              </QuestionnaireDescription>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="sim">Sim, retém</QuestionnaireChoice>
                <QuestionnaireChoice value="nao">Não retém</QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireFooter>
              <QuestionnairePrevious />
              <QuestionnaireNext />
              <QuestionnaireSubmit>Responder ao agente</QuestionnaireSubmit>
            </QuestionnaireFooter>
          </Questionnaire>
        </div>
      )}
    </div>
  )
}

/** Pergunta desabilitada e erro */
export function States() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <Questionnaire aria-label="Pergunta desabilitada">
        <QuestionnaireItem name="certificado" disabled>
          <QuestionnaireTitle>Qual certificado assina as notas?</QuestionnaireTitle>
          <QuestionnaireDescription>
            Libera depois que o certificado A1 for enviado.
          </QuestionnaireDescription>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="a1">Certificado A1</QuestionnaireChoice>
            <QuestionnaireChoice value="a3">Certificado A3</QuestionnaireChoice>
          </QuestionnaireChoices>
        </QuestionnaireItem>
      </Questionnaire>

      <Questionnaire aria-label="Pergunta com erro">
        <QuestionnaireItem name="aceite" required>
          <QuestionnaireTitle>Quem assina o pedido de emissão?</QuestionnaireTitle>
          <QuestionnaireChoices>
            <QuestionnaireChoice value="socio">O sócio administrador</QuestionnaireChoice>
            <QuestionnaireChoice value="contador">O contador</QuestionnaireChoice>
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
        <QuestionnaireFooter>
          <QuestionnaireSubmit>Enviar sem responder</QuestionnaireSubmit>
        </QuestionnaireFooter>
      </Questionnaire>
    </div>
  )
}
