import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Gantt,
  RivoProvider,
  type GanttTask,
  type GanttTaskChange,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";

const TODAY = new Date(2026, 9, 15);
const day = (month: number, date: number) => new Date(2026, month - 1, date);

const PROJECT: GanttTask[] = [
  {
    id: "levantamento",
    title: "Levantamento de requisitos",
    start: day(10, 1),
    end: day(10, 8),
    progress: 100,
    group: "Planejamento",
    assignee: "Ana Prado",
    tone: "success",
  },
  {
    id: "aprovacao",
    title: "Aprovação do escopo",
    start: day(10, 8),
    end: day(10, 8),
    dependsOn: ["levantamento"],
    group: "Planejamento",
    assignee: "Diretoria",
    tone: "accent",
  },
  {
    id: "servidor",
    title: "Instalar servidor",
    start: day(10, 12),
    end: day(10, 19),
    progress: 40,
    dependsOn: ["aprovacao"],
    group: "Infraestrutura",
    assignee: "Bruno Lima",
    tone: "info",
  },
  {
    id: "rede",
    title: "Cabeamento da filial",
    start: day(10, 14),
    end: day(10, 24),
    progress: 20,
    group: "Infraestrutura",
    assignee: "Célia Dias",
  },
  {
    id: "migracao",
    title: "Migração do cadastro de clientes",
    start: day(10, 19),
    end: day(10, 31),
    dependsOn: ["servidor"],
    group: "Migração",
    assignee: "Davi Rocha",
    tone: "warning",
  },
  {
    id: "fiscal",
    title: "Conferência das notas fiscais",
    start: day(10, 27),
    end: day(11, 6),
    dependsOn: ["migracao"],
    group: "Migração",
    assignee: "Eva Nunes",
    tone: "danger",
  },
  {
    id: "treinamento",
    title: "Treinamento da equipe",
    start: day(11, 3),
    end: day(11, 12),
    dependsOn: ["servidor"],
    assignee: "Ana Prado",
  },
  {
    id: "virada",
    title: "Virada do sistema",
    start: day(11, 16),
    end: day(11, 16),
    dependsOn: ["fiscal", "treinamento"],
    tone: "accent",
  },
];

const MANY: GanttTask[] = Array.from({ length: 400 }, (_, index) => {
  const start = day(10, 1 + (index % 40));
  return {
    id: `os-${index}`,
    title: `Ordem de serviço ${1200 + index}`,
    start,
    end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2 + (index % 6)),
    progress: (index * 13) % 100,
    group: `Equipe ${Math.floor(index / 50) + 1}`,
    tone: (["neutral", "accent", "success", "info"] as const)[index % 4],
  };
});

function apply(list: GanttTask[], task: GanttTask, change: GanttTaskChange) {
  return list.map((item) =>
    item.id === task.id ? { ...item, start: change.start, end: change.end } : item,
  );
}

function Sample({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  const [tasks, setTasks] = useState(PROJECT);
  const [many, setMany] = useState(MANY);

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <section className="mb-10 flex flex-col gap-3">
        <p className="text-sm font-medium text-fg">Implantação do ERP, com edição</p>
        <Gantt
          label="Implantação do ERP"
          tasks={tasks}
          today={TODAY}
          defaultScale="day"
          maxHeight={420}
          onTaskChange={(task, change) => setTasks((list) => apply(list, task, change))}
        />
      </section>

      <section className="mb-10 flex flex-col gap-3">
        <p className="text-sm font-medium text-fg">Quatrocentas ordens de serviço, por semana</p>
        <Gantt
          label="Ordens de serviço"
          tasks={many}
          today={TODAY}
          defaultScale="week"
          defaultCollapsedGroups={[
            "Equipe 3",
            "Equipe 4",
            "Equipe 5",
            "Equipe 6",
            "Equipe 7",
            "Equipe 8",
          ]}
          maxHeight={360}
          onTaskChange={(task, change) => setMany((list) => apply(list, task, change))}
        />
      </section>

      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm font-medium text-fg">Carregando</p>
          <Gantt label="Cronograma carregando" tasks={undefined} scales={["month"]} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm font-medium text-fg">Por mês, só leitura</p>
          <Gantt
            label="Implantação por mês"
            tasks={PROJECT}
            today={TODAY}
            scales={["month"]}
            columns={["title", "assignee"]}
            maxHeight={320}
          />
        </div>
      </section>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" density="comfortable" />
    <Sample theme="rivocode-dark" density="compact" />
    <Sample theme="rivocode-light" density="comfortable" />
    <Sample theme="rivocode-light" density="compact" />
  </div>,
);
