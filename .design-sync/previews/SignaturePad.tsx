import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  SignaturePad,
  signatureToPng,
  signatureToSvg,
  type SignatureValue,
} from '@rivocode/ui'
import { useState } from 'react'

const ACEITE: SignatureValue = {
  kind: 'drawn',
  width: 600,
  height: 200,
  strokes: [
    [
      { x: 70, y: 130, time: 0 },
      { x: 95, y: 90, time: 30 },
      { x: 120, y: 70, time: 60 },
      { x: 135, y: 95, time: 90 },
      { x: 150, y: 135, time: 120 },
      { x: 175, y: 105, time: 150 },
      { x: 205, y: 120, time: 180 },
      { x: 240, y: 110, time: 210 },
      { x: 280, y: 128, time: 240 },
      { x: 330, y: 112, time: 270 },
    ],
    [
      { x: 360, y: 140, time: 400 },
      { x: 420, y: 118, time: 430 },
      { x: 500, y: 126, time: 460 },
    ],
  ],
}

/** Assinar o aceite */
export function Sign() {
  const [assinatura, setAssinatura] = useState<SignatureValue | null>(null)

  return (
    <Field className="max-w-xl">
      <FieldLabel>Assinatura do locatário</FieldLabel>
      <SignaturePad value={assinatura} onValueChange={setAssinatura} name="assinatura" />
      <FieldDescription>
        {assinatura === null
          ? 'Vale como aceite do contrato de locação.'
          : assinatura.kind === 'typed'
            ? 'Assinatura digitada.'
            : `${assinatura.strokes.length} traço(s).`}
      </FieldDescription>
    </Field>
  )
}

/** Exportar SVG e PNG */
export function Export() {
  const [assinatura, setAssinatura] = useState<SignatureValue | null>(ACEITE)
  const [png, setPng] = useState('')

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Field>
        <FieldLabel>Assinatura</FieldLabel>
        <SignaturePad value={assinatura} onValueChange={setAssinatura} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={assinatura === null}
          onClick={async () => setPng(await signatureToPng(assinatura, { paper: true }))}
        >
          Gerar PNG
        </Button>
        <span className="self-center font-mono text-xs text-fg-muted">
          SVG com {signatureToSvg(assinatura).length} caracteres
        </span>
      </div>
      {png ? (
        <img
          src={png}
          alt="Prévia da assinatura exportada"
          className="w-60 rounded-md border border-border"
        />
      ) : null}
    </div>
  )
}

/** Digitar em vez de desenhar */
export function Typed() {
  const [assinatura, setAssinatura] = useState<SignatureValue | null>({
    kind: 'typed',
    text: 'Maria Souza',
    font: '"Great Vibes", "Snell Roundhand", cursive',
    width: 600,
    height: 200,
  })

  return (
    <Field className="max-w-xl">
      <FieldLabel>Assinatura</FieldLabel>
      <SignaturePad
        value={assinatura}
        onValueChange={setAssinatura}
        font='"Great Vibes", "Snell Roundhand", cursive'
      />
    </Field>
  )
}

/** Estados */
export function States() {
  return (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <Field invalid>
        <FieldLabel>Obrigatória</FieldLabel>
        <SignaturePad />
        <FieldDescription>Assine para continuar.</FieldDescription>
      </Field>
      <Field disabled>
        <FieldLabel>Desabilitada</FieldLabel>
        <SignaturePad />
      </Field>
      <Field>
        <FieldLabel>Só leitura</FieldLabel>
        <SignaturePad readOnly defaultValue={ACEITE} />
      </Field>
      <Field>
        <FieldLabel>Mais alta</FieldLabel>
        <SignaturePad ratio={2} />
      </Field>
    </div>
  )
}
