import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Calendar,
  DatePicker,
  DateRangePicker,
  EventCalendar,
  RivoProvider,
  type CalendarEvent,
  type DateRange,
  type RivoTheme,
} from "../src/index";

const DIA = new Date(2026, 2, 4);
const em = (hora: number, minuto = 0) =>
  new Date(DIA.getFullYear(), DIA.getMonth(), DIA.getDate(), hora, minuto);

const AGENDA: CalendarEvent[] = [
  { id: "1", title: "Fechamento de caixa", start: em(8), end: em(9), tone: "accent" },
  { id: "2", title: "Conferencia com o contador", start: em(9, 30), end: em(11) },
  { id: "3", title: "Visita tecnica na Clinica Sao Lucas", start: em(10), end: em(12), tone: "warning" },
  { id: "4", title: "Almoco", start: em(12), end: em(13), tone: "neutral" },
  { id: "5", title: "Vence a NF-e 4813", start: em(14), end: em(14, 5), tone: "danger" },
  { id: "6", title: "Retrospectiva", start: em(16), end: em(17, 30), tone: "success" },
  {
    id: "7",
    title: "Inventario de estoque",
    start: new Date(2026, 2, 3),
    end: new Date(2026, 2, 6),
    allDay: true,
    tone: "accent",
  },
];

function Sample({ theme }: { theme: RivoTheme }) {
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(2026, 2, 3));
  const [periodo, setPeriodo] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 3),
    to: new Date(2026, 2, 12),
  });

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[620px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="mb-10">
        <p className="mb-3 text-sm font-medium text-fg">A agenda, na vista de dia</p>
        <EventCalendar
          label="Agenda de 4 de marco"
          view="day"
          defaultDate={DIA}
          events={AGENDA}
          maxHeight={420}
        />
      </div>

      <div className="mb-10">
        <p className="mb-3 text-sm font-medium text-fg">A mesma agenda, no mes</p>
        <EventCalendar
          label="Marco de 2026"
          view="month"
          defaultDate={DIA}
          events={AGENDA}
          maxHeight={480}
        />
      </div>

      <div className="flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-12">
        <div className="w-full max-w-64">
          <label htmlFor="dueDate" className="mb-1.5 block text-sm font-medium text-fg">
            Vencimento
          </label>
          <DatePicker id="dueDate" value={dueDate} onValueChange={setDueDate} confirm />
        </div>

        <div className="w-full max-w-72">
          <p className="mb-1.5 text-sm font-medium text-fg">Periodo do relatorio</p>
          <DateRangePicker value={periodo} onValueChange={setPeriodo} />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-12">
        <div>
          <p className="mb-3 text-sm text-fg-muted">Calendario, data unica</p>
          <Calendar mode="single" selected={dueDate} month={new Date(2026, 2, 1)} />
        </div>

        <div>
          <p className="mb-3 text-sm text-fg-muted">Calendario, intervalo</p>
          <Calendar
            mode="range"
            selected={periodo}
            month={new Date(2026, 2, 1)}
            numberOfMonths={2}
          />
        </div>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" />
    <Sample theme="rivocode-light" />
  </div>,
);
