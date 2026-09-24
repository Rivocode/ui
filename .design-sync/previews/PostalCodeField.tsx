import {
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  PostalCodeField,
  type PostalAddress,
} from '@rivocode/ui'
import { useState } from 'react'

type ViaCepAnswer = {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean | string
}

async function lookupViaCep(cep: string, signal: AbortSignal): Promise<PostalAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`)
  const data: ViaCepAnswer = await response.json()
  if (data.erro) return null
  return { street: data.logradouro, district: data.bairro, city: data.localidade, state: data.uf }
}

const EMPTY: PostalAddress = { street: '', district: '', city: '', state: '' }

/** Com ViaCEP */
export function WithViaCep() {
  const [address, setAddress] = useState<PostalAddress>(EMPTY)

  return (
    <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel>CEP</FieldLabel>
        <PostalCodeField lookup={lookupViaCep} onAddress={setAddress} className="sm:w-48" />
        <FieldDescription>O endereço se preenche sozinho.</FieldDescription>
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel>Rua</FieldLabel>
        <Input
          value={address.street}
          onChange={(event) => setAddress({ ...address, street: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>Bairro</FieldLabel>
        <Input
          value={address.district}
          onChange={(event) => setAddress({ ...address, district: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>Cidade</FieldLabel>
        <Input
          value={`${address.city}${address.state ? ` - ${address.state}` : ''}`}
          readOnly
        />
      </Field>
    </div>
  )
}

const KNOWN: Record<string, PostalAddress> = {
  '58038000': {
    street: 'Avenida Epitácio Pessoa',
    district: 'Tambaú',
    city: 'João Pessoa',
    state: 'PB',
  },
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

async function lookupOffline(cep: string, signal: AbortSignal) {
  await wait(900, signal)
  if (cep.startsWith('0')) throw new Error('Sem conexão')
  return KNOWN[cep] ?? null
}

/** Os quatro finais */
export function States() {
  return (
    <div className="flex w-72 flex-col gap-4">
      <Field>
        <FieldLabel>Acha o endereço</FieldLabel>
        <PostalCodeField lookup={lookupOffline} defaultValue="58038000" />
        <FieldDescription>Apague um número e digite de novo: 58038-000.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Não acha</FieldLabel>
        <PostalCodeField lookup={lookupOffline} />
        <FieldDescription>Qualquer CEP que não comece por zero: 99999-999.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Falha de rede</FieldLabel>
        <PostalCodeField lookup={lookupOffline} />
        <FieldDescription>Um CEP que comece por zero: 01310-100.</FieldDescription>
      </Field>
    </div>
  )
}
