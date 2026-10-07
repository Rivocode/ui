/**
 * O canal por onde uma guarda entrega o que mediu, sem que alguem leia a frase.
 *
 * Cada guarda termina imprimindo o que mediu, e o `docs/ESTADO.md` copiava
 * essas frases a mao. Copia a mao envelhece: em 25/09 o ESTADO foi escrito, e
 * em 07/10 quase todo numero dele estava errado sem nada acusar. O
 * `gen-estado.ts` passa a escrever esses numeros, e para isso precisa deles
 * como DADO, e nao como frase de terminal - frase muda de redacao, e regex
 * sobre ela vira a proxima guarda que passa sem medir.
 *
 * Fora do `gen-estado.ts`, `RC_MEDIDA` nao existe e `report` nao faz nada: a
 * guarda roda igual no gate. Dentro dele, cada guarda roda pelo MESMO comando
 * do `scripts.check`, com a variavel apontando para um arquivo proprio, e o
 * que ela escreve ali e o que ela acabou de medir - nao uma segunda conta
 * feita ao lado, que poderia discordar da primeira.
 */
import { writeFileSync } from "node:fs";

export type Measure = Record<string, unknown>;

export function report(measure: Measure) {
  const target = process.env.RC_MEDIDA;
  if (!target) return;

  writeFileSync(target, JSON.stringify(measure));
}
