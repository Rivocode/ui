## Como construir com o @rivocode/ui

Biblioteca white-label da RivoCode. Nenhum componente conhece a cor da marca:
ele pede um token semantico e o tema responde. Isso e o que permite a mesma
peca servir a RivoCode num projeto e outro cliente no seguinte.

### Envolva tudo no RivoProvider

Sem ele nada tem estilo, e `Dialog`, `Menu`, `Select`, `Tooltip` e os avisos
lancam erro, porque leem o contexto dele.

```tsx
import { RivoProvider, Button } from '@rivocode/ui'

<RivoProvider theme="rivocode-dark" density="comfortable">
  <Button>Salvar alteracoes</Button>
</RivoProvider>
```

- `theme`: `rivocode-dark` (padrao), `rivocode-light` ou `system`.
- `density`: `comfortable` (padrao) ou `compact`, para tela de operacao.
- `scope`: `global` veste a pagina; `local` veste so esta arvore e **pinta o
  fundo**. Em preview e em cartao isolado use `local`, senao o conteudo fica
  claro sobre claro.

O Provider ja carrega por dentro o provedor de dica, a fiacao de aviso e um
container de portal que leva o tema junto. Nao monte nenhum deles a mao.

### O vocabulario, que e o do Tailwind v4

Escreva layout com as mesmas classes que os componentes usam. **Nunca escreva
cor literal nem `z-index` numerico.**

| Familia | Classes |
|---|---|
| Superficie | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay` |
| Texto | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled` |
| Acento | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle` |
| Linha e foco | `border-border`, `border-border-strong`, `ring-ring` |
| Estado | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Selecao e carga | `bg-selected`, `bg-skeleton` |
| Forma | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Texto | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Sombra | `shadow-1`, `shadow-2`, `shadow-3` |
| Empilhamento | `z-[var(--rc-z-dialog)]`, e os pares `dropdown`, `overlay`, `popover`, `toast`, `tooltip` |

**Preencher e escrever texto sao tokens diferentes.** `bg-danger` preenche e
recebe `text-danger-fg` por cima. `text-danger-text` e o vermelho que se le
sobre o fundo da pagina. Nenhuma cor serve para as duas funcoes. Vale igual
para o acento: `bg-accent` com `text-accent-fg`, ou `text-accent-text` solto.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponiveis.

### Onde esta a verdade

- `_ds/<pasta>/styles.css` e o que ele importa: todos os tokens e os dois temas.
- `components/<Grupo>/<Nome>/<Nome>.d.ts`: o contrato de props de cada peca.
- `components/<Grupo>/<Nome>/<Nome>.prompt.md`: como compor cada peca.

### Um exemplo do idioma

```tsx
<RivoProvider theme="rivocode-dark">
  <main className="min-h-screen bg-bg p-8 font-sans text-fg">
    <h1 className="mb-6 font-display text-3xl">Notas fiscais</h1>
    <Card>
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent className="text-fg-muted">
        Doze notas processadas, tres pendentes.
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="ghost">Exportar</Button>
      </CardFooter>
    </Card>
  </main>
</RivoProvider>
```

Botao em pilula (`shape="pill"`) e o tamanho `cta` sao de pagina de marketing.
Em tela de produto o padrao e o canto de 8px.
