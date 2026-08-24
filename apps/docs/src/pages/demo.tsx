import { DemoApp } from '@/demo/app'

/* ---------------------------------------------------------------------------
 * The demo address
 *
 * A thin page around the application. Everything interesting is in `demo/`,
 * which is written the way someone would write a real screen with this
 * library, and not the way documentation usually gets written.
 * ------------------------------------------------------------------------- */

export function DemoPage() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-fg">Um sistema de verdade</h1>
        <p className="mt-2 max-w-2xl text-fg-muted">
          Emissão de notas fiscais, montada só com as peças da biblioteca. Feche a barra pelo botão
          ou por Ctrl+B, abra a busca por Ctrl+K, e troque o tema em Ajustes: nenhum componente
          conhece a cor da marca.
        </p>
      </header>

      <DemoApp />
    </div>
  )
}
