/**
 * `ToggleGroup` -> `toggle-group`, `OTPField` -> `otp-field`.
 *
 * O endereco e o que a pessoa digita, compartilha e entrega a um agente, entao
 * ele fica em minuscula e com hifen. Sequencia de maiusculas fica inteira:
 * quebrar em cada maiuscula viraria `OTPField` em `o-t-p-field`.
 *
 * Usada pelo app e pelo plugin do Vite que serve o markdown cru, para a pagina
 * e o `.md` dela nunca discordarem do endereco.
 */
export function slugify(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
