import { Avatar, Badge, Button, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@rivocode/ui'

export function LinhaDeLista() {
  return (
    <div className="flex w-96 flex-col">
      <Item>
        <ItemMedia>
          <Avatar size="sm" fallback="CS" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Clinica Sao Lucas</ItemTitle>
          <ItemDescription>12.345.678/0001-99</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge tone="success">Paga</Badge>
        </ItemActions>
      </Item>
      <Item>
        <ItemMedia>
          <Avatar size="sm" fallback="TC" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Transportes Cabo Branco</ItemTitle>
          <ItemDescription>98.765.432/0001-10</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge>Aberta</Badge>
        </ItemActions>
      </Item>
    </div>
  )
}

export function ComMoldura() {
  return (
    <Item variant="outline" interactive className="w-96">
      <ItemMedia>
        <Avatar fallback="SM" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Supermercado Tambau</ItemTitle>
        <ItemDescription>Ultima nota em 18/08</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">Abrir</Button>
      </ItemActions>
    </Item>
  )
}
