import { Button, Gantt, type GanttTask, type GanttTaskChange } from '@rivocode/ui'
import { useState } from 'react'

const TODAY = new Date(2026, 9, 15)

function day(month: number, date: number) {
  return new Date(2026, month - 1, date)
}

const PROJECT: GanttTask[] = [
  {
    id: 'requisitos',
    title: 'Levantamento de requisitos',
    start: day(10, 1),
    end: day(10, 8),
    progress: 100,
    group: 'Planejamento',
    assignee: 'Ana Prado',
    tone: 'success',
  },
  {
    id: 'escopo',
    title: 'Aprovação do escopo',
    start: day(10, 8),
    end: day(10, 8),
    dependsOn: ['requisitos'],
    group: 'Planejamento',
    assignee: 'Diretoria',
    tone: 'accent',
  },
  {
    id: 'servidor',
    title: 'Instalar servidor',
    start: day(10, 12),
    end: day(10, 19),
    progress: 40,
    dependsOn: ['escopo'],
    group: 'Infraestrutura',
    assignee: 'Bruno Lima',
    tone: 'info',
  },
  {
    id: 'rede',
    title: 'Cabeamento da filial',
    start: day(10, 14),
    end: day(10, 24),
    progress: 20,
    group: 'Infraestrutura',
    assignee: 'Célia Dias',
  },
  {
    id: 'migracao',
    title: 'Migração do cadastro de clientes',
    start: day(10, 19),
    end: day(10, 31),
    dependsOn: ['servidor'],
    group: 'Migração',
    assignee: 'Davi Rocha',
    tone: 'warning',
  },
  {
    id: 'treinamento',
    title: 'Treinamento da equipe',
    start: day(11, 3),
    end: day(11, 12),
    dependsOn: ['servidor'],
    assignee: 'Eva Nunes',
  },
  {
    id: 'virada',
    title: 'Virada do sistema',
    start: day(11, 16),
    end: day(11, 16),
    dependsOn: ['migracao', 'treinamento'],
    tone: 'accent',
  },
]

function apply(tasks: GanttTask[], task: GanttTask, change: GanttTaskChange) {
  return tasks.map((item) => (item.id === task.id ? { ...item, start: change.start, end: change.end } : item))
}

/** Editable timeline */
export function Editable() {
  const [tasks, setTasks] = useState(PROJECT)

  return (
    <Gantt
      label="Implantação do ERP"
      tasks={tasks}
      today={TODAY}
      defaultScale="day"
      onTaskChange={(task, change) => setTasks((current) => apply(current, task, change))}
    />
  )
}

/** Read-only, by week */
export function ReadOnly() {
  return <Gantt label="Implantação do ERP" tasks={PROJECT} today={TODAY} defaultScale="week" />
}

/** By month, with the chosen columns */
export function Monthly() {
  return (
    <Gantt
      label="Implantação por mês"
      tasks={PROJECT}
      today={TODAY}
      scales={['month']}
      columns={['title', 'assignee', { id: 'progress', header: 'Feito', width: 72, cell: (task) => `${task.progress ?? 0}%` }]}
    />
  )
}

const ORDERS: GanttTask[] = Array.from({ length: 300 }, (_, index) => ({
  id: `os-${index}`,
  title: `Ordem de serviço ${1200 + index}`,
  start: day(10, 1 + (index % 30)),
  end: day(10, 4 + (index % 30) + (index % 5)),
  progress: (index * 17) % 100,
  group: `Equipe ${Math.floor(index / 30) + 1}`,
}))

/** Three hundred tasks, with collapsed groups */
export function Many() {
  return (
    <Gantt
      label="Ordens de serviço"
      tasks={ORDERS}
      today={TODAY}
      defaultScale="week"
      defaultCollapsedGroups={['Equipe 3', 'Equipe 4', 'Equipe 5', 'Equipe 6', 'Equipe 7', 'Equipe 8', 'Equipe 9', 'Equipe 10']}
      maxHeight={360}
    />
  )
}

/** Loading */
export function Loading() {
  return <Gantt label="Implantação do ERP" tasks={undefined} />
}

/** Error */
export function Error() {
  return (
    <Gantt
      label="Implantação do ERP"
      tasks={undefined}
      isError
      onRetry={() => {}}
      errorMessage="O servidor não respondeu. Tente de novo em alguns minutos."
    />
  )
}

/** Empty */
export function Empty() {
  return (
    <Gantt
      label="Implantação do ERP"
      tasks={[]}
      empty={{
        title: 'Nenhuma tarefa no projeto',
        description: 'Crie a primeira tarefa para montar o cronograma.',
        action: <Button size="sm">Nova tarefa</Button>,
      }}
    />
  )
}
