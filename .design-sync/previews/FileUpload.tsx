import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  useToast,
  type Rejection,
} from '@rivocode/ui'
import { useState } from 'react'

/** Default */
export function Default() {
  return (
    <FileUpload
      className="w-full max-w-md"
      label="Arraste o XML da nota, ou clique para escolher"
      hint="XML ou PDF, até 5 MB"
      accept=".xml,application/pdf"
      maxSize={5 * 1024 * 1024}
      multiple
    />
  )
}

type Item = {
  id: string
  name: string
  size: number
  progress?: number
  error?: string
}

/** With the list of uploaded files */
export function WithList() {
  const toast = useToast()
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'nota-4813.xml', size: 48_213 },
    { id: '2', name: 'comprovante-agosto.pdf', size: 1_284_500, progress: 62 },
    { id: '3', name: 'contrato-prefeitura.pdf', size: 3_410_000, error: 'A conexão caiu.' },
  ])

  /* A real upload would be a fetch with progress; the demo only records the
     input. The component knows nothing about the network: each item's state
     belongs to the app. */
  function receive(files: File[]) {
    setItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}`,
        name: file.name,
        size: file.size,
      })),
    ])
  }

  function reject(rejections: Rejection[]) {
    for (const rejection of rejections) {
      toast.add({ title: `${rejection.file.name}: ${rejection.reason}` })
    }
  }

  return (
    <div className="w-full max-w-md">
      <FileUpload
        label="Arraste os anexos da nota"
        hint="XML ou PDF, até 5 MB"
        accept=".xml,application/pdf"
        maxSize={5 * 1024 * 1024}
        multiple
        onSelect={receive}
        onReject={reject}
      />
      <FileUploadList>
        {items.map((item) => (
          <FileUploadItem
            key={item.id}
            name={item.name}
            size={item.size}
            progress={item.progress}
            error={item.error}
            onRetry={() =>
              setItems((current) =>
                current.map((other) =>
                  other.id === item.id ? { ...other, error: undefined, progress: 10 } : other,
                ),
              )
            }
            onRemove={() =>
              setItems((current) => current.filter((other) => other.id !== item.id))
            }
          />
        ))}
      </FileUploadList>
    </div>
  )
}

/** Disabled */
export function Disabled() {
  return (
    <FileUpload
      className="w-full max-w-md"
      label="Arraste o XML da nota"
      hint="Envio bloqueado enquanto a emissão está em andamento."
      disabled
    />
  )
}
