import { expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { RivoProvider, useRivoContext } from '../src/provider/rivo-provider'

function Espia() {
  const { theme, density, portalContainer } = useRivoContext()
  return (
    <span data-testid="espia" data-portal={portalContainer ? 'sim' : 'nao'}>
      {theme}/{density}
    </span>
  )
}

test('o modo global marca o tema no elemento raiz do documento', () => {
  render(
    <RivoProvider scope="global" theme="rivocode-dark">
      <p>ola</p>
    </RivoProvider>,
  )
  expect(document.documentElement.dataset.rcTheme).toBe('rivocode-dark')
  expect(document.documentElement.dataset.rcDensity).toBe('comfortable')
})

test('o modo escopado marca o proprio elemento e nao toca no documento', () => {
  document.documentElement.removeAttribute('data-rc-theme')
  render(
    <RivoProvider scope="local" theme="rivocode-light" density="compact">
      <p>ola</p>
    </RivoProvider>,
  )
  const escopo = document.querySelector('div[data-rc-theme="rivocode-light"]')
  expect(escopo).not.toBeNull()
  expect(escopo?.getAttribute('data-rc-density')).toBe('compact')
  expect(document.documentElement.dataset.rcTheme).toBeUndefined()
})

test('o contexto entrega tema, densidade e container de portal', () => {
  render(
    <RivoProvider theme="rivocode-dark" density="compact">
      <Espia />
    </RivoProvider>,
  )
  expect(screen.getByTestId('espia').textContent).toBe('rivocode-dark/compact')
  expect(screen.getByTestId('espia').dataset.portal).toBe('sim')
})

test('o container de portal carrega o tema, senao o dialogo sai sem estilo', () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <p>ola</p>
    </RivoProvider>,
  )
  const portais = document.body.querySelectorAll(
    ':scope > [data-rc-portal][data-rc-theme="rivocode-light"]',
  )
  expect(portais.length).toBe(1)
})

test('usar o contexto fora do Provider da um erro que explica o que fazer', () => {
  expect(() => render(<Espia />)).toThrow(/RivoProvider/)
})
