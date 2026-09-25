import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  PageHeader,
  PasswordInput,
  RelativeTime,
  Separator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  useToast,
} from '@rivocode/ui'
import { Laptop, Smartphone } from 'lucide-react'
import { useState } from 'react'

const NOTICES = [
  { id: 'issued', title: 'Nota emitida', description: 'Um e-mail a cada nota autorizada pela prefeitura.' },
  { id: 'overdue', title: 'Nota vencida', description: 'No dia seguinte ao vencimento, com o link de cobrança.' },
  { id: 'weekly', title: 'Resumo da semana', description: 'Toda segunda, com o faturado e o recebido.' },
  { id: 'certificate', title: 'Certificado perto de vencer', description: 'Trinta, quinze e sete dias antes.' },
]

const SESSIONS = [
  { id: 'mac', device: 'Chrome no macOS', place: 'João Pessoa', seenAt: new Date(Date.now() - 2 * 60_000), current: true },
  { id: 'phone', device: 'Safari no iPhone', place: 'Recife', seenAt: new Date(Date.now() - 26 * 3_600_000), current: false },
]

export default function SettingsPage() {
  const toast = useToast()
  const [notices, setNotices] = useState<Record<string, boolean>>({
    issued: true,
    overdue: true,
    weekly: false,
    certificate: true,
  })

  const saved = (title: string) =>
    toast.add({ title, description: 'Vale a partir de agora, em todos os seus acessos.' })

  return (
    <div className="w-full bg-bg p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Configurações" description="Seu perfil, a empresa e o que chega por e-mail." />

        <Tabs defaultValue="profile">
          <TabList>
            <Tab value="profile">Perfil</Tab>
            <Tab value="company">Empresa</Tab>
            <Tab value="notices">Avisos</Tab>
            <Tab value="security">Segurança</Tab>
          </TabList>

          <TabPanel value="profile" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Como você aparece para o resto da equipe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar alt="Marina Albuquerque" fallback="MA" size="lg" />
                  <Button variant="secondary" size="sm">
                    Trocar foto
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Nome</FieldLabel>
                    <Input defaultValue="Marina Albuquerque" autoComplete="name" />
                  </Field>
                  <Field>
                    <FieldLabel>E-mail</FieldLabel>
                    <Input defaultValue="marina@saolucas.com.br" type="email" autoComplete="email" />
                    <FieldDescription>É para onde vão os avisos.</FieldDescription>
                  </Field>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => saved('Perfil salvo')}>Salvar perfil</Button>
              </CardFooter>
            </Card>
          </TabPanel>

          <TabPanel value="company" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresa</CardTitle>
                <CardDescription>Estes dados saem em toda nota emitida.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2">
                  <FieldLabel>Razão social</FieldLabel>
                  <Input defaultValue="Clínica São Lucas Ltda." />
                </Field>
                <Field>
                  <FieldLabel>CNPJ</FieldLabel>
                  <Input defaultValue="12.345.678/0001-95" readOnly className="font-mono" />
                  <FieldDescription>Para trocar o CNPJ, fale com o suporte.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Inscrição municipal</FieldLabel>
                  <Input defaultValue="1.234.567-8" className="font-mono" />
                </Field>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => saved('Dados da empresa salvos')}>Salvar empresa</Button>
              </CardFooter>
            </Card>
          </TabPanel>

          <TabPanel value="notices" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Avisos por e-mail</CardTitle>
                <CardDescription>Liga e desliga na hora, sem precisar salvar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {NOTICES.map((notice, index) => (
                  <div key={notice.id}>
                    {index > 0 && <Separator className="my-3" />}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg">{notice.title}</p>
                        <p className="text-sm text-fg-muted">{notice.description}</p>
                      </div>
                      <Switch
                        aria-label={notice.title}
                        checked={notices[notice.id]}
                        onCheckedChange={(checked) =>
                          setNotices((current) => ({ ...current, [notice.id]: checked }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value="security" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Senha</CardTitle>
                <CardDescription>Pelo menos 8 caracteres. Os acessos abertos continuam.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Senha atual</FieldLabel>
                  <PasswordInput autoComplete="current-password" />
                </Field>
                <Field>
                  <FieldLabel>Senha nova</FieldLabel>
                  <PasswordInput autoComplete="new-password" />
                </Field>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={() => saved('Senha trocada')}>Trocar senha</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acessos abertos</CardTitle>
                <CardDescription>Encerre o que você não reconhece.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {SESSIONS.map((session) => (
                  <Item key={session.id} variant="outline">
                    <ItemMedia>
                      {session.id === 'phone' ? (
                        <Smartphone size={18} aria-hidden="true" className="text-fg-subtle" />
                      ) : (
                        <Laptop size={18} aria-hidden="true" className="text-fg-subtle" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {session.device}
                        {session.current && (
                          <Badge tone="success" size="sm" className="ml-2">
                            Este acesso
                          </Badge>
                        )}
                      </ItemTitle>
                      <ItemDescription>
                        {session.place}, <RelativeTime value={session.seenAt} />
                      </ItemDescription>
                    </ItemContent>
                    {!session.current && (
                      <ItemActions>
                        <Button variant="ghost" size="sm">
                          Encerrar
                        </Button>
                      </ItemActions>
                    )}
                  </Item>
                ))}
              </CardContent>
            </Card>

            <Card className="border-danger">
              <CardHeader>
                <CardTitle>Excluir a conta</CardTitle>
                <CardDescription>
                  As notas emitidas continuam na prefeitura, mas somem deste painel.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-end">
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="danger" />}>
                    Excluir a conta
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Excluir a conta da Clínica São Lucas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A equipe perde o acesso agora, e o histórico de notas some deste painel. Não
                      dá para desfazer.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogClose render={<Button variant="secondary" />}>
                        Manter a conta
                      </AlertDialogClose>
                      <AlertDialogClose render={<Button variant="danger" />}>
                        Excluir a conta
                      </AlertDialogClose>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}
