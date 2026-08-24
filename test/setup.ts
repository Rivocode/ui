// Registra um DOM no bun test, que roda sem navegador por padrao.
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// Desmonta o que cada teste montou. Sem isto, um Provider deixa atributo e
// container de portal para tras, e o teste seguinte mede sujeira do anterior.
const { cleanup } = await import('@testing-library/react')
const { afterEach } = await import('bun:test')

afterEach(cleanup)
