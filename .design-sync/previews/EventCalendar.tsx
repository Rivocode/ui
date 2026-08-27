import { Badge, Button, EventCalendar, type CalendarEvent } from '@rivocode/ui'
import { useState } from 'react'

const ANCHOR = new Date(2026, 2, 17)

function at(day: number, hour: number, minute = 0) {
  return new Date(2026, 2, day, hour, minute)
}

const WEEK: CalendarEvent[] = [
  { id: '1', title: 'Reunião com o contador', start: at(16, 9), end: at(16, 10), tone: 'accent' },
  { id: '2', title: 'Fechamento da folha', start: at(16, 14), end: at(16, 16), tone: 'warning' },
  { id: '3', title: 'Diária da equipe', start: at(17, 9), end: at(17, 9, 30) },
  { id: '4', title: 'Almoço com o cliente', start: at(17, 12), end: at(17, 13, 30) },
  { id: '5', title: 'Revisão do orçamento', start: at(18, 10), end: at(18, 11, 30), tone: 'info' },
  { id: '6', title: 'Entrega da apuração', start: at(19, 15), end: at(19, 17), tone: 'danger' },
  { id: '7', title: 'Retrospectiva', start: at(20, 16), end: at(20, 17), tone: 'success' },
]

/** Semana */
export function Week() {
  return <EventCalendar defaultView="week" defaultDate={ANCHOR} events={WEEK} label="Agenda da equipe" />
}

/** Dia */
export function Day() {
  return (
    <EventCalendar
      defaultView="day"
      defaultDate={ANCHOR}
      events={WEEK}
      dayStart={8}
      dayEnd={19}
      label="Agenda do dia"
    />
  )
}

const MONTH: CalendarEvent[] = [
  ...WEEK,
  { id: '8', title: 'Vencimento do DAS', start: at(20, 0), end: at(21, 0), allDay: true, tone: 'danger' },
  { id: '9', title: 'Feira do setor', start: at(24, 0), end: at(27, 0), allDay: true, tone: 'info' },
  { id: '10', title: 'Consultoria', start: at(9, 14), end: at(9, 16) },
  { id: '11', title: 'Auditoria interna', start: at(10, 9), end: at(10, 18), tone: 'warning' },
  { id: '12', title: 'Treinamento', start: at(25, 9), end: at(25, 12) },
  { id: '13', title: 'Fechamento do mês', start: at(31, 8), end: at(31, 18), tone: 'accent' },
]

/** Mês */
export function Month() {
  return <EventCalendar defaultView="month" defaultDate={ANCHOR} events={MONTH} label="Mês da equipe" />
}

/** Agenda */
export function Agenda() {
  return (
    <EventCalendar defaultView="agenda" defaultDate={ANCHOR} events={MONTH} label="Próximos compromissos" />
  )
}

const CLASH: CalendarEvent[] = [
  { id: 'a', title: 'Consulta de Ana Prado', start: at(17, 9), end: at(17, 12), tone: 'accent' },
  { id: 'b', title: 'Consulta de Bruno Lima', start: at(17, 9), end: at(17, 10) },
  { id: 'c', title: 'Retorno de Célia Dias', start: at(17, 9), end: at(17, 9, 30), tone: 'info' },
  { id: 'd', title: 'Encaixe de Davi Rocha', start: at(17, 9), end: at(17, 10, 30), tone: 'warning' },
  { id: 'e', title: 'Consulta de Eva Nunes', start: at(17, 10, 30), end: at(17, 11), tone: 'success' },
]

/** Choque de horário */
export function Overlap() {
  return (
    <EventCalendar
      defaultView="day"
      defaultDate={ANCHOR}
      events={CLASH}
      dayStart={8}
      dayEnd={13}
      maxColumns={3}
      label="Agenda do consultório"
    />
  )
}

const ACROSS: CalendarEvent[] = [
  { id: 'trip', title: 'Viagem a Recife', start: at(16, 0), end: at(19, 0), allDay: true, tone: 'info' },
  { id: 'holiday', title: 'Feriado municipal', start: at(18, 0), end: at(19, 0), allDay: true },
  { id: 'night', title: 'Plantão da virada', start: at(17, 22), end: at(18, 9), tone: 'warning' },
]

/** Dia inteiro e a noite que atravessa */
export function AcrossDays() {
  return (
    <EventCalendar
      defaultView="week"
      defaultDate={ANCHOR}
      events={ACROSS}
      dayStart={7}
      dayEnd={23}
      label="Agenda da equipe"
    />
  )
}

/** Escolher e criar */
export function Interactive() {
  const [picked, setPicked] = useState<string>('Nada escolhido ainda.')

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm text-fg-muted">{picked}</p>
      <EventCalendar
        defaultView="week"
        defaultDate={ANCHOR}
        events={WEEK}
        label="Agenda da equipe"
        onEventSelect={(event) => setPicked(`Aberto: ${event.title}`)}
        onSlotSelect={(range) =>
          setPicked(`Novo compromisso às ${range.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
        }
      />
    </div>
  )
}

/** Tarja com desenho próprio */
export function CustomEvent() {
  return (
    <EventCalendar
      defaultView="day"
      defaultDate={ANCHOR}
      events={CLASH}
      dayStart={8}
      dayEnd={13}
      label="Agenda do consultório"
      renderEvent={(event, info) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium">{event.title}</span>
          {info.shape === 'block' && <Badge size="sm">Confirmado</Badge>}
        </div>
      )}
    />
  )
}

/** Carregando */
export function Loading() {
  return <EventCalendar defaultView="week" defaultDate={ANCHOR} isLoading label="Agenda da equipe" />
}

/** Erro */
export function Error() {
  return (
    <EventCalendar
      defaultView="week"
      defaultDate={ANCHOR}
      isError
      onRetry={() => {}}
      errorTitle="Não foi possível carregar a agenda"
      errorMessage="O servidor não respondeu. Tente de novo em alguns minutos."
      label="Agenda da equipe"
    />
  )
}

/** Vazio */
export function Empty() {
  return (
    <EventCalendar
      defaultView="week"
      defaultDate={ANCHOR}
      events={[]}
      label="Agenda da equipe"
      empty={{
        title: 'Semana livre',
        description: 'Nenhum compromisso marcado entre 16 e 22 de março.',
        action: <Button size="sm">Marcar compromisso</Button>,
      }}
    />
  )
}
