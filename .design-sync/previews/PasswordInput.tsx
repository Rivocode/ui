import { Field, FieldLabel, PasswordInput } from '@rivocode/ui'

/** Sign in */
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
