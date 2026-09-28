import { PixCode, buildPixPayload } from '@rivocode/ui'

const COBRANCA = buildPixPayload({
  key: '+5583988112233',
  name: 'Clínica São Lucas',
  city: 'João Pessoa',
  amount: 1284.5,
  txid: 'NF4813',
  description: 'Nota 4813',
})

/** Charge with an amount */
export function Charge() {
  return <PixCode payload={COBRANCA} />
}

/** While the charge is generated */
export function Loading() {
  return <PixCode payload="" loading amount={1284.5} />
}

/** Expired code */
export function Expired() {
  return <PixCode payload={COBRANCA} expired onRenew={() => {}} />
}
