import { QRCode } from '@rivocode/ui'

const LINK_DA_NOTA = 'https://nfse.rivocode.com.br/consulta/35240612345678000199550010000048131234567890'

/** Invoice lookup link */
export function InvoiceLink() {
  return <QRCode value={LINK_DA_NOTA} label="QR Code para consultar a nota 4813" />
}

/** With the logo in the center */
export function WithLogo() {
  return (
    <QRCode
      value={LINK_DA_NOTA}
      label="QR Code para consultar a nota 4813"
      size={200}
      logo={<span className="font-display text-sm font-semibold">R</span>}
    />
  )
}

/** Loose on the page, and sturdier */
export function OnPage() {
  return (
    <div className="bg-bg p-4">
      <QRCode value={LINK_DA_NOTA} label="QR Code para consultar a nota 4813" level="Q" size={128} />
    </div>
  )
}
