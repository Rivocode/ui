---
category: Formulário
---

# PostalCodeField

O campo de CEP que busca o endereço: põe a máscara `99999-999` e, quando a
pessoa completa os 8 dígitos, chama a sua função `lookup` e entrega o endereço
por `onAddress`, para o resto do formulário se preencher sozinho.

```tsx
<Field>
  <FieldLabel>CEP</FieldLabel>
  <PostalCodeField lookup={lookupViaCep} onAddress={fillAddress} />
</Field>
```

**A biblioteca não chama serviço nenhum.** Quem busca é a função que você
passa: ela recebe os 8 dígitos e o `signal` da busca, e devolve
`{ street, district, city, state }`, ou `null` quando o CEP não existe. Você
escolhe o serviço (ViaCEP, BrasilAPI, o seu próprio servidor), a política de
cache e o que fazer com o dado.

## Com ViaCEP

```tsx
async function lookupViaCep(cep: string, signal: AbortSignal): Promise<PostalAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`)
  const data = await response.json()
  if (data.erro) return null
  return { street: data.logradouro, district: data.bairro, city: data.localidade, state: data.uf }
}
```

Três regras de contrato, e a função acima segue as três:

- **`null` é "não existe".** O ViaCEP responde `200` com `{ "erro": true }`
  para CEP que não existe, e é a função que traduz isso para `null`.
- **Rejeitar é falha de rede.** Timeout, sem conexão, servidor fora do ar: a
  peça mostra outro aviso, com o "Tentar de novo".
- **Repasse o `signal` ao `fetch`.** Quando a pessoa troca o CEP no meio da
  busca, a peça cancela a anterior. A resposta velha é descartada de qualquer
  jeito, mas com o `signal` a requisição para de verdade.

## Os quatro finais

| Estado | Na tela | No leitor de tela |
|---|---|---|
| Buscando | giro no fim do campo, e o campo com `aria-busy` | "Buscando endereço…" |
| Achou | um visto no fim do campo, e `onAddress` chamado | "Endereço encontrado." |
| Não achou | aviso em vermelho embaixo, campo inválido | o próprio aviso |
| Falha de rede | aviso neutro com "Tentar de novo", campo **não** inválido | o próprio aviso |

A falha de rede não marca o campo como inválido de propósito: o CEP pode estar
certo, e a pessoa ainda consegue preencher o endereço à mão. O aviso sai ligado
ao campo por `aria-describedby`, junto com a `FieldDescription` que já
estivesse lá, e todos os anúncios saem numa região viva que existe antes da
primeira busca.

A busca só roda quando a pessoa digita. `defaultValue`, ou um `value` que
chega do servidor ao editar um cadastro, não dispara nada: buscar ali
sobrescreveria o endereço que a pessoa já tinha acertado à mão. Apagar um
dígito cancela a busca em curso e limpa o aviso. `onStatusChange` conta cada
troca de estado, para quem quer travar o botão de enviar enquanto busca.

## No formulário

Com o `FormField`, guarde os dígitos pelo `onValueChange` e preencha o resto
pelo `setValue` do formulário:

```tsx
const form = useZodForm(schema, { defaultValues: { cep: '', street: '', city: '' } })

<FormField name="cep" label="CEP">
  {(field) => (
    <PostalCodeField
      name={field.name}
      value={field.value}
      onBlur={field.onBlur}
      onValueChange={(_masked, digits) => field.onChange(digits)}
      lookup={lookupViaCep}
      onAddress={(address) => {
        form.setValue('street', address.street)
        form.setValue('city', address.city)
      }}
    />
  )}
</FormField>
```

O erro do schema (`z.string().length(8)`, por exemplo) continua saindo pelo
`FormField`, embaixo do campo, e convive com o aviso da busca.

## Partes

`classNames` alcança cada nó pelo nome: `input`, `suffix` (o giro e o visto),
`message` e `retry`. `className` veste a raiz, que embrulha o campo e o aviso.

## Quando não usar

- **CEP sem busca de endereço** é `MaskedInput` com `mask="cep"`. Se a tela
  não vai preencher nada com a resposta, a busca só gasta rede e mostra um
  giro que não serve a ninguém.
- **Endereço fora do Brasil** não tem CEP. Use `Input` com o rótulo do país
  ("ZIP code", "Código postal"), sem máscara.
- **Escolher entre endereços já cadastrados** é `Combobox`, com a lista de
  endereços do cliente. O `PostalCodeField` é para escrever um endereço novo.

## No React Native

Traduz, com a mesma `lookup`, o mesmo `onAddress` e os mesmos quatro finais, e com a busca cancelada quando o CEP muda: a regra mora num arquivo só, compartilhado pelos dois pacotes. O campo é controlado, como todo o nativo: `value` e `onValueChange` recebem os dígitos, sem a pontuação.

O giro fica no fim do campo, o aviso embaixo dele, e cada troca de estado sai pelo anúncio do leitor de tela do sistema. O "Tentar de novo" da falha de rede é um botão de verdade, com alvo de toque inteiro.
