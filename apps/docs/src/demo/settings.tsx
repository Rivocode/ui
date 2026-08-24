import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Kbd,
  Separator,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type RivoDensity,
  type RivoTheme,
} from '@rivocode/ui'
import { Info } from 'lucide-react'

const SHORTCUTS: Array<[string, string]> = [
  ['mod+k', 'Abrir a busca de comandos'],
  ['mod+b', 'Abrir e fechar a barra lateral'],
  ['mod+n', 'Nova nota fiscal'],
  ['esc', 'Fechar o que estiver aberto'],
]

export function Settings({
  theme,
  onTheme,
  density,
  onDensity,
}: {
  theme: RivoTheme
  onTheme: (next: RivoTheme) => void
  density: RivoDensity
  onDensity: (next: RivoDensity) => void
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Tabs defaultValue="appearance">
        <TabList>
          <Tab value="appearance">Aparência</Tab>
          <Tab value="account">Conta</Tab>
          <Tab value="shortcuts">Atalhos</Tab>
        </TabList>

        <TabPanel value="appearance">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>
                  Nenhum componente conhece a cor da marca. Ele pede um papel, e o tema responde.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['rivocode-dark', 'Escuro'],
                      ['rivocode-light', 'Claro'],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      variant={theme === value ? 'secondary' : 'ghost'}
                      aria-pressed={theme === value}
                      onClick={() => onTheme(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-fg">Densidade</p>
                  <p className="mt-1 mb-3 text-sm text-fg-muted">
                    Compacta encolhe a altura de todo controle de uma vez. Vale para tela de
                    operação, onde cabe mais linha na mesma altura.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['comfortable', 'Confortável'],
                        ['compact', 'Compacta'],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        variant={density === value ? 'secondary' : 'ghost'}
                        aria-pressed={density === value}
                        onClick={() => onDensity(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Listagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Switch defaultChecked>Mostrar o CNPJ abaixo do nome</Switch>
                <Switch>Abrir a nota ao clicar na linha</Switch>

                <Field>
                  <FieldLabel>Linhas por página</FieldLabel>
                  <Slider defaultValue={8} min={5} max={50} step={5} thumbLabel="Linhas" />
                  <FieldDescription>Vale para todas as listagens do sistema.</FieldDescription>
                </Field>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="account">
          <Card>
            <CardContent className="space-y-5 py-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg" fallback="EB" />
                <div>
                  <p className="text-fg">Emanuel Bacalhau</p>
                  <p className="text-sm text-fg-muted">Administrador</p>
                </div>
                <Button variant="secondary" size="sm" className="ml-auto">
                  Trocar foto
                </Button>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Nome</FieldLabel>
                  <Input defaultValue="Emanuel Bacalhau" />
                </Field>
                <Field>
                  <FieldLabel>E-mail</FieldLabel>
                  <Input type="email" defaultValue="emanuel@rivocode.com.br" />
                </Field>
              </div>

              <Alert tone="info">
                <Info size={16} />
                <AlertTitle>Certificado A1 vence em 34 dias</AlertTitle>
                <AlertDescription>
                  Sem ele a emissão para. Renove pelo portal do seu contador.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="shortcuts">
          <Card>
            <CardContent className="py-2">
              {SHORTCUTS.map(([keys, what], index) => (
                <div key={keys}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-fg-muted">{what}</span>
                    <Kbd keys={keys} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  )
}
