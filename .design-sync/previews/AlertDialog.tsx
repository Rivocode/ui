import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger, Button } from '@rivocode/ui'

export function Cancelamento() {
  return (
    <div className="min-h-72">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger render={<Button variant="destructive" />}>Cancelar nota</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Cancelar a nota 4813?</AlertDialogTitle>
          <AlertDialogDescription>
            A prefeitura recebe o cancelamento e o cliente e avisado. Nao da para desfazer.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Manter nota</AlertDialogClose>
            <AlertDialogClose render={<Button variant="destructive" />}>Cancelar nota</AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
