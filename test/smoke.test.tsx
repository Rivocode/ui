import { expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { version } from '../src/index'

test('o pacote expoe a versao da fundacao', () => {
  expect(version).toBe('0.1.0')
})

test('o ambiente de teste tem DOM', () => {
  render(<p>ok</p>)
  expect(screen.getByText('ok')).toBeDefined()
})
