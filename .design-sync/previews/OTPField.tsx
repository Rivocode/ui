import { OTPField } from '@rivocode/ui'

/** Preenchido */
export function Filled() {
  return <OTPField length={6} defaultValue="481337" />
}

/** Vazio */
export function Empty() {
  return <OTPField length={6} />
}
