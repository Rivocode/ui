import { OTPField } from '@rivocode/ui'

export function Preenchido() {
  return <OTPField length={6} defaultValue="481337" />
}

export function Vazio() {
  return <OTPField length={6} />
}
