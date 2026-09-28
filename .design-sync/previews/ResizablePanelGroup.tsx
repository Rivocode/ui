import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@rivocode/ui'

const PASTAS = ['Notas emitidas', 'Canceladas', 'Rascunhos', 'Modelos']

/** Three areas, with the middle one split vertically */
export function Workspace() {
  return (
    <div className="h-72 w-[40rem] overflow-hidden rounded-lg border border-border">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={25} minSize={15}>
          <ul className="flex flex-col py-2">
            {PASTAS.map((pasta) => (
              <li key={pasta} className="truncate px-3 py-1.5 text-sm text-fg-muted">
                {pasta}
              </li>
            ))}
          </ul>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Entre pastas e nota" />
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={65} minSize={30} className="p-3 text-base text-fg">
              NF-e 4813 · Clínica São Lucas
            </ResizablePanel>
            <ResizableHandle aria-label="Entre nota e eventos" />
            <ResizablePanel minSize={20} className="p-3 text-sm text-fg-muted">
              Autorizada pela SEFAZ às 14:02.
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle aria-label="Entre nota e inspetor" />
        <ResizablePanel minSize={15} className="p-3 text-sm text-fg-muted">
          Inspetor
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

/** A side panel that collapses and remembers its size */
export function CollapsibleSidebar() {
  return (
    <div className="h-56 w-[36rem] overflow-hidden rounded-lg border border-border">
      <ResizablePanelGroup autoSaveId="exemplo-lateral">
        <ResizablePanel defaultSize={30} minSize={20} collapsible>
          <p className="p-3 text-sm text-fg-muted">Filtros do período</p>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Largura dos filtros" />
        <ResizablePanel className="p-3 text-base text-fg">
          Arraste a divisória além da metade do mínimo, ou aperte Enter nela, e os filtros
          recolhem.
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
