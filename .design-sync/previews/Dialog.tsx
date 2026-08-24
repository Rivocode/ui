import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@rivocode/ui'

/** Confirmação */
export function Confirmation() {
  return (
    <div className="min-h-72">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="destructive" />}>Excluir projeto</DialogTrigger>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogDescription>
            Isto remove o projeto, o histórico e os arquivos ligados a ele. Não da para desfazer.
          </DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancelar</DialogClose>
            <Button variant="destructive">Excluir projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Fechado */
export function ClosedState() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>Abrir dialogo</DialogTrigger>
      <DialogContent>
        <DialogTitle>Título</DialogTitle>
        <DialogDescription>Corpo do dialogo.</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
