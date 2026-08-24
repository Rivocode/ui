import { Button, Sheet, SheetClose, SheetContent, SheetDescription, SheetHandle, SheetTitle, SheetTrigger } from '@rivocode/ui'

export function FolhaDeBaixo() {
  return (
    <div className="min-h-80">
      <Sheet side="bottom" defaultOpen>
        <SheetTrigger render={<Button variant="secondary" />}>Acoes da nota</SheetTrigger>
        <SheetContent>
          <SheetHandle />
          <SheetTitle>Nota 4813</SheetTitle>
          <SheetDescription>Clinica Sao Lucas, vencimento em 05/08.</SheetDescription>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary">Baixar PDF</Button>
            <SheetClose render={<Button variant="ghost" />}>Cancelar</SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function Lateral() {
  return (
    <Sheet side="left">
      <SheetTrigger render={<Button variant="secondary" />}>Abrir menu</SheetTrigger>
      <SheetContent>
        <SheetTitle>Navegacao</SheetTitle>
        <SheetDescription>Escolha para onde ir.</SheetDescription>
      </SheetContent>
    </Sheet>
  )
}
