import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Calendar,
  DatePicker,
  DateRangePicker,
  RivoProvider,
  type DateRange,
  type RivoTheme,
} from "../src/index";

function Amostra({ theme }: { theme: RivoTheme }) {
  const [vencimento, setVencimento] = useState<Date | undefined>(new Date(2026, 2, 3));
  const [periodo, setPeriodo] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 3),
    to: new Date(2026, 2, 12),
  });

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[620px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-12">
        <div className="w-full max-w-64">
          <label htmlFor="vencimento" className="mb-1.5 block text-sm font-medium text-fg">
            Vencimento
          </label>
          <DatePicker id="vencimento" value={vencimento} onValueChange={setVencimento} confirmar />
        </div>

        <div className="w-full max-w-72">
          <p className="mb-1.5 text-sm font-medium text-fg">Periodo do relatorio</p>
          <DateRangePicker value={periodo} onValueChange={setPeriodo} />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-12">
        <div>
          <p className="mb-3 text-sm text-fg-muted">Calendario, data unica</p>
          <Calendar mode="single" selected={vencimento} month={new Date(2026, 2, 1)} />
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
    <Amostra theme="rivocode-dark" />
    <Amostra theme="rivocode-light" />
  </div>,
);
