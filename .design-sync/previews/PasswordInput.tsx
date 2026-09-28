import { Field, FieldLabel, PasswordInput } from '@rivocode/ui'

/** Entrar */
export function SignIn() {
  return (
    <div className="w-72">
      <Field>
        <FieldLabel>Senha</FieldLabel>
        <PasswordInput placeholder="Sua senha" autoComplete="current-password" />
      </Field>
    </div>
  )
}
