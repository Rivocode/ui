/** Fotografa a vitrine, para revisao visual sem abrir navegador na mao. */
import { servir } from './serve'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const PAGINAS = [
  { rota: '/index.html', saida: 'demo/dist/vitrine.png', janela: '1240,2600' },
  { rota: '/dialog.html', saida: 'demo/dist/dialogo.png', janela: '1240,760' },
  { rota: '/listagem.html', saida: 'demo/dist/listagem.png', janela: '1240,1180' },
]

const servidor = servir()

for (const { rota, saida, janela } of PAGINAS) {
  const proc = Bun.spawn([
    CHROME,
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    `--screenshot=${saida}`,
    `--window-size=${janela}`,
    '--virtual-time-budget=4000',
    `http://127.0.0.1:${servidor.port}${rota}`,
  ], { stderr: 'ignore', stdout: 'ignore' })
  await proc.exited
  const bytes = await Bun.file(saida).size
  console.log(`${saida}  ${(bytes / 1024).toFixed(0)} KB`)
}

await servidor.stop(true)
