import { EmptyState, Button } from '@rivocode/ui'
import { CloudOff } from 'lucide-react'
import { Component, type ReactNode } from 'react'

/* ---------------------------------------------------------------------------
 * Quando o pedaco nao chega
 *
 * Cada rota, cada corpo de doc e cada exemplo virou um chunk proprio, entao a
 * pagina passou a depender de downloads que acontecem DEPOIS de ela abrir. Dois
 * jeitos de isso falhar sao rotina, e nenhum e culpa de quem le: rede que cai
 * no meio, e deploy novo que apaga os arquivos com hash da aba aberta ha uma
 * hora - o import estoura com "Failed to fetch dynamically imported module".
 *
 * Sem esta fronteira, os dois casos dao tela branca: o erro sobe ate a raiz e o
 * React desmonta a arvore inteira, cabecalho e barra lateral junto. Recarregar
 * resolve o segundo caso sempre, e por isso o botao esta aqui.
 * ------------------------------------------------------------------------- */

type Props = { children: ReactNode }

export class PageBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="py-20">
        <EmptyState
          icon={<CloudOff size={20} />}
          title="Esta parte da página não carregou"
          description="Pode ter sido a rede, ou uma versão nova do site publicada com esta aba aberta. Recarregar resolve os dois casos."
          action={<Button onClick={() => window.location.reload()}>Recarregar</Button>}
        />
      </div>
    )
  }
}
