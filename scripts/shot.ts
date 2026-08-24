/** Fotografa a vitrine, para revisao visual sem abrir navegador na mao. */
import { servir } from "./serve";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Cada pagina sai duas vezes: na largura de mesa e na de celular. O retrato
 * estreito e o que pega painel que sai da tela, tabela que empurra a pagina e
 * calendario de dois meses que nao cabe.
 */
const PAGINAS = [
  { rota: "/index.html", nome: "vitrine", altura: 2600, alturaCelular: 4200 },
  { rota: "/dialog.html", nome: "dialogo", altura: 760, alturaCelular: 900 },
  { rota: "/listagem.html", nome: "listagem", altura: 1900, alturaCelular: 2000 },
  { rota: "/flutuantes.html", nome: "flutuantes", altura: 1120, alturaCelular: 1500 },
  { rota: "/datas.html", nome: "datas", altura: 1240, alturaCelular: 1800 },
  { rota: "/formulario.html", nome: "formulario", altura: 1280, alturaCelular: 2100 },
];

/** O piso de largura de janela do Chrome no macOS. */
const LARGURA_JANELA_MINIMA = 500;

const servidor = servir();

/**
 * O Chrome no macOS nao abre janela abaixo de 500px de largura. Pedir 390
 * devolve um retrato cortado em 390 com layout de 500, que e pior do que nao
 * ter retrato: parece certo e esconde o que quebrou. Por isso a largura de
 * celular vem de um iframe dentro de `celular.html`.
 */
const RETRATOS = PAGINAS.flatMap(({ rota, nome, altura, alturaCelular }) => [
  { rota, saida: `demo/dist/${nome}.png`, janela: `1240,${altura}` },
  {
    rota: `/celular.html#.${rota}`,
    saida: `demo/dist/${nome}-celular.png`,
    janela: `${LARGURA_JANELA_MINIMA},${alturaCelular}`,
  },
]);

for (const { rota, saida, janela } of RETRATOS) {
  const proc = Bun.spawn(
    [
      CHROME,
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--screenshot=${saida}`,
      `--window-size=${janela}`,
      "--virtual-time-budget=4000",
      `http://127.0.0.1:${servidor.port}${rota}`,
    ],
    { stderr: "ignore", stdout: "ignore" },
  );
  await proc.exited;
  const bytes = await Bun.file(saida).size;
  console.log(`${saida}  ${(bytes / 1024).toFixed(0)} KB`);
}

await servidor.stop(true);
