import { Tab, TabList, TabPanel, Tabs } from '@rivocode/ui'

/** Básico */
export function Basic() {
  return (
    <Tabs defaultValue="abertas" className="max-w-lg">
      <TabList>
        <Tab value="todas">Todas</Tab>
        <Tab value="abertas">Abertas</Tab>
        <Tab value="vencidas">Vencidas</Tab>
      </TabList>
      <TabPanel value="todas">Quarenta e duas notas no período.</TabPanel>
      <TabPanel value="abertas">Doze notas aguardando pagamento.</TabPanel>
      <TabPanel value="vencidas">Três notas vencidas, somando R$ 18,4K.</TabPanel>
    </Tabs>
  )
}

/** Com aba desabilitada */
export function WithDisabledTab() {
  return (
    <Tabs defaultValue="dados" className="max-w-lg">
      <TabList>
        <Tab value="dados">Dados</Tab>
        <Tab value="anexos">Anexos</Tab>
        <Tab value="historico" disabled>Histórico</Tab>
      </TabList>
      <TabPanel value="dados">Razão social, CNPJ e endereço.</TabPanel>
      <TabPanel value="anexos">Nenhum anexo enviado.</TabPanel>
    </Tabs>
  )
}
