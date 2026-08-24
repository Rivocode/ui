import { Button, Sheet, SheetClose, SheetContent, SheetDescription, SheetHandle, SheetTitle, SheetTrigger } from '@rivocode/ui'

/** Folha de baixo */
export function BottomSheet() {
  return (
    <div className="min-h-80">
      <Sheet side="bottom" defaultOpen>
        <SheetTrigger render={<Button variant="secondary" />}>Ações da nota</SheetTrigger>
        <SheetContent>
          <SheetHandle />
          <SheetTitle>Nota 4813</SheetTitle>
          <SheetDescription>Clínica São Lucas, vencimento em 05/08.</SheetDescription>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary">Baixar PDF</Button>
            <SheetClose render={<Button variant="ghost" />}>Cancelar</SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Lateral */
export function SideSheet() {
  return (
    <Sheet side="left">
      <SheetTrigger render={<Button variant="secondary" />}>Abrir menu</SheetTrigger>
      <SheetContent>
        <SheetTitle>Navegação</SheetTitle>
        <SheetDescription>Escolha para onde ir.</SheetDescription>
      </SheetContent>
    </Sheet>
  )
}
