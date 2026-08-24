import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@rivocode/ui'

export function Confirmacao() {
  return (
    <div className="min-h-72">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="destructive" />}>Excluir projeto</DialogTrigger>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogDescription>
            Isto remove o projeto, o historico e os arquivos ligados a ele. Nao da para desfazer.
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

export function Fechado() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" />}>Abrir dialogo</DialogTrigger>
      <DialogContent>
        <DialogTitle>Titulo</DialogTitle>
        <DialogDescription>Corpo do dialogo.</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
