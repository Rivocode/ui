import { Spoiler } from '@rivocode/ui'

/** Descrição longa de produto */
export function ProductDescription() {
  return (
    <Spoiler maxHeight={96} className="max-w-prose text-base text-fg-muted">
      <p>
        O plano Empresa emite nota fiscal de serviço em mais de 1.200 prefeituras, com o
        certificado A1 guardado por nós e renovação avisada com trinta dias de antecedência.
      </p>
      <p className="mt-3">
        Boletos e cobranças por Pix saem da mesma tela, e a baixa acontece sozinha quando o
        banco confirma o pagamento. O relatório do mês fecha no primeiro dia útil, pronto para
        o contador, com o XML de cada nota e o extrato das cobranças.
      </p>
      <p className="mt-3">
        Até cinco pessoas usam a conta sem custo extra, cada uma com o próprio papel, e o
        histórico guarda quem emitiu, cancelou ou reenviou cada documento.
      </p>
    </Spoiler>
  )
}

/** Texto curto: sem botão */
export function ShortText() {
  return (
    <Spoiler maxHeight={96} className="max-w-prose text-base text-fg-muted">
      <p>O certificado vence em 12 de março. Renove antes para não parar a emissão.</p>
    </Spoiler>
  )
}

/** Com outros textos no botão */
export function CustomLabels() {
  return (
    <Spoiler
      maxHeight={72}
      labels={{ more: 'Ver o termo inteiro', less: 'Recolher o termo' }}
      className="max-w-prose text-sm text-fg-muted"
    >
      <p>
        Ao aceitar, você autoriza a emissão de documentos fiscais em nome da empresa cadastrada,
        declara que as informações prestadas são verdadeiras e concorda que a RivoCode guarde os
        arquivos pelo prazo que a legislação exige. A autorização pode ser revogada a qualquer
        momento nas configurações da conta, sem prejuízo dos documentos já emitidos.
      </p>
    </Spoiler>
  )
}
