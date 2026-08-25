/** Fotografa a vitrine, para revisao visual sem abrir navegador na mao. */
import { servir } from "./serve";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Cada pagina sai duas vezes: na largura de mesa e na de celular. O retrato
 * estreito e o que pega painel que sai da tela, tabela que empurra a pagina e
 * calendario de dois meses que nao cabe.
 */
const PAGINAS = [
  { rota: "/index.html", name: "vitrine", height: 2600, alturaCelular: 4200 },
  { rota: "/dialog.html", name: "dialogo", height: 760, alturaCelular: 900 },
  { rota: "/listagem.html", name: "listagem", height: 1900, alturaCelular: 2000 },
  { rota: "/flutuantes.html", name: "flutuantes", height: 1120, alturaCelular: 1500 },
  { rota: "/datas.html", name: "datas", height: 1240, alturaCelular: 1800 },
  { rota: "/formulario.html", name: "formulario", height: 1280, alturaCelular: 2100 },
  { rota: "/navegacao.html", name: "navegacao", height: 1000, alturaCelular: 1200 },
  { rota: "/folhas.html", name: "folhas", height: 1120, alturaCelular: 1200 },
  { rota: "/consulta.html", name: "consulta", height: 2000, alturaCelular: 3200 },
  { rota: "/completos.html", name: "completos", height: 1900, alturaCelular: 3400 },
  { rota: "/graficos.html", name: "graficos", height: 1700, alturaCelular: 2600 },
  { rota: "/controles.html", name: "controles", height: 2000, alturaCelular: 3400 },
  { rota: "/dados.html", name: "dados", height: 1800, alturaCelular: 3000 },
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
const RETRATOS = PAGINAS.flatMap(({ rota, name, height, alturaCelular }) => [
  { rota, output: `demo/dist/${name}.png`, janela: `1240,${height}` },
  {
    rota: `/celular.html#.${rota}`,
    output: `demo/dist/${name}-celular.png`,
    janela: `${LARGURA_JANELA_MINIMA},${alturaCelular}`,
  },
]);

for (const { rota, output, janela } of RETRATOS) {
  const proc = Bun.spawn(
    [
      CHROME,
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--screenshot=${output}`,
      `--window-size=${janela}`,
      "--virtual-time-budget=4000",
      // Sem isto, grafico com animacao sai sem as marcas: a Recharts interpola
      // em JS e o retrato acontece antes de o primeiro quadro chegar.
      "--force-prefers-reduced-motion",
      `http://127.0.0.1:${servidor.port}${rota}`,
    ],
    { stderr: "ignore", stdout: "ignore" },
  );
  await proc.exited;
  const bytes = await Bun.file(output).size;
  console.log(`${output}  ${(bytes / 1024).toFixed(0)} KB`);
}

await servidor.stop(true);
