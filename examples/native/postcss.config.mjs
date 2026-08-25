// Sem este arquivo o Tailwind nunca roda: o CSS entra cru no bundle, com as
// variáveis do tema e nenhuma utility gerada — a tela renderiza sem estilo,
// sem erro e sem pista, igual ao esquecimento do @source no web.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
