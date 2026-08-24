import { Tab, TabList, TabPanel, Tabs } from '@rivocode/ui'

export function Basico() {
  return (
    <Tabs defaultValue="abertas" className="max-w-lg">
      <TabList>
        <Tab value="todas">Todas</Tab>
        <Tab value="abertas">Abertas</Tab>
        <Tab value="vencidas">Vencidas</Tab>
      </TabList>
      <TabPanel value="todas">Quarenta e duas notas no periodo.</TabPanel>
      <TabPanel value="abertas">Doze notas aguardando pagamento.</TabPanel>
      <TabPanel value="vencidas">Tres notas vencidas, somando R$ 18.400,00.</TabPanel>
    </Tabs>
  )
}

export function ComAbaDesabilitada() {
  return (
    <Tabs defaultValue="dados" className="max-w-lg">
      <TabList>
        <Tab value="dados">Dados</Tab>
        <Tab value="anexos">Anexos</Tab>
        <Tab value="historico" disabled>Historico</Tab>
      </TabList>
      <TabPanel value="dados">Razao social, CNPJ e endereco.</TabPanel>
      <TabPanel value="anexos">Nenhum anexo enviado.</TabPanel>
    </Tabs>
  )
}
