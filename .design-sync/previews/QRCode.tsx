import { QRCode } from '@rivocode/ui'

const LINK_DA_NOTA = 'https://nfse.rivocode.com.br/consulta/35240612345678000199550010000048131234567890'

/** Link de consulta da nota */
export function InvoiceLink() {
  return <QRCode value={LINK_DA_NOTA} label="QR Code para consultar a nota 4813" />
}

/** Com a marca no centro */
export function WithLogo() {
  return (
    <QRCode
      value={LINK_DA_NOTA}
      label="QR Code para consultar a nota 4813"
      size={200}
      logo={<span className="font-display text-sm font-semibold text-fg">R</span>}
    />
  )
}

/** Solto na página, e mais robusto */
export function OnPage() {
  return (
    <div className="bg-bg p-4">
      <QRCode value={LINK_DA_NOTA} label="QR Code para consultar a nota 4813" level="Q" background="bg" size={128} />
    </div>
  )
}
