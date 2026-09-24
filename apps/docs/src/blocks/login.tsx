import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Checkbox,
  Heading,
  Input,
  Link,
  PasswordInput,
  Text,
} from '@rivocode/ui'
import { Form, FormField, forChecked, useZodForm } from '@rivocode/ui/form'
import { Waves } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Escreva o e-mail no formato nome@empresa.com.br'),
  password: z.string().min(8, 'A senha tem pelo menos 8 caracteres'),
  remember: z.boolean(),
})

type Credentials = z.output<typeof schema>

async function signIn(credentials: Credentials) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return credentials.password === 'rivocode2026'
}

export default function LoginPage() {
  const form = useZodForm(schema, {
    defaultValues: { email: '', password: '', remember: true },
  })
  const [refused, setRefused] = useState(false)

  return (
    <main className="flex min-h-[40rem] w-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Waves size={28} className="mx-auto text-accent-text" aria-hidden="true" />
          <Heading level={1}>Entrar na sua conta</Heading>
          <Text tone="muted" size="sm">
            Use o e-mail em que você recebe as notas.
          </Text>
        </div>

        <Card>
          <CardContent className="py-6">
            <Form
              form={form}
              onSubmit={async (credentials) => {
                setRefused(false)
                const accepted = await signIn(credentials)
                if (!accepted) setRefused(true)
              }}
            >
              {refused && (
                <Alert tone="danger">
                  <AlertTitle>E-mail ou senha não conferem</AlertTitle>
                  <AlertDescription>
                    Confira os dois e tente de novo. Depois de cinco tentativas, a conta espera 15
                    minutos.
                  </AlertDescription>
                </Alert>
              )}

              <FormField name="email" label="E-mail">
                {(field) => (
                  <Input {...field} type="email" autoComplete="email" placeholder="você@empresa.com.br" />
                )}
              </FormField>

              <FormField name="password" label="Senha">
                {(field) => <PasswordInput {...field} autoComplete="current-password" />}
              </FormField>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <FormField name="remember">
                  {(field) => <Checkbox {...forChecked(field)}>Manter conectado</Checkbox>}
                </FormField>
                <Link href="#recuperar" className="text-sm">
                  Esqueci a senha
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
                Entrar
              </Button>
            </Form>
          </CardContent>
        </Card>

        <Text tone="subtle" size="sm" className="text-center">
          Ainda não tem conta? <Link href="#cadastro">Fale com o comercial</Link>
        </Text>
      </div>
    </main>
  )
}
