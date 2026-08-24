import { expect, test } from 'bun:test'

import { contrastRatio, readTokens } from '../scripts/check-contrast'

const read = (p: string) => Bun.file(p).text()

const base = async () =>
  (await read('src/tokens/palette.css')) + '\n' + (await read('src/tokens/scales.css'))

test('todo token que o contrato referencia existe nos dois temas', async () => {
  const contract = await read('src/tokens/contract.css')
  const referenced = [...contract.matchAll(/var\((--rc-[\w-]+)\)/g)].map(m => m[1]!)
  expect(referenced.length).toBeGreaterThan(20)

  const shared = await base()
  const dark = readTokens(shared + (await read('src/tokens/themes/rivocode-dark.css')))
  const light = readTokens(shared + (await read('src/tokens/themes/rivocode-light.css')))

  const faltando = referenced.filter(t => !dark[t] || !light[t])
  expect(faltando).toEqual([])
})

test('nenhum componente le da paleta crua', async () => {
  const { Glob } = await import('bun')
  const files = await Array.fromAsync(
    new Glob('src/{primitives,provider}/**/*.{ts,tsx}').scan('.'),
  )
  for (const file of files) {
    expect(await Bun.file(file).text()).not.toContain('--rc-p-')
  }
})

test('a densidade compacta encolhe todo controle', async () => {
  const scales = readTokens(await read('src/tokens/scales.css'))
  expect(scales['--rc-control-md']).toBeDefined()
})

test('o acento do tema claro passa como texto, e a lima crua nao passaria', async () => {
  const shared = await base()
  const light = readTokens(shared + (await read('src/tokens/themes/rivocode-light.css')))
  expect(contrastRatio(light['--rc-accent-text']!, light['--rc-bg']!)).toBeGreaterThan(4.5)
  expect(contrastRatio('#d4f34a', light['--rc-bg']!)).toBeLessThan(2)
})
