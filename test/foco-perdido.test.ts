import { expect, test } from "bun:test";

import { focusIsLost } from "../src/lib/focus";

function button(setup: (element: HTMLButtonElement) => void = () => {}) {
  const element = document.createElement("button");
  document.body.appendChild(element);
  setup(element);
  return element;
}

test("sem alvo, e com o corpo da pagina como alvo, o foco esta perdido", () => {
  expect(focusIsLost(null)).toBe(true);
  expect(focusIsLost(document.body)).toBe(true);
});

test("alvo vivo e focavel nao conta como perdido, para nada ser roubado de quem moveu o foco", () => {
  const alive = button();

  expect(focusIsLost(alive)).toBe(false);

  alive.remove();
});

test("alvo que saiu da arvore conta como perdido, porque nao ha para onde tabular dele", () => {
  const gone = button();
  gone.remove();

  expect(focusIsLost(gone)).toBe(true);
});

test("alvo ainda ativo mas ja `disabled` conta como perdido: e a ordem do Firefox", () => {
  const dying = button((element) => {
    element.disabled = true;
  });

  expect(focusIsLost(dying)).toBe(true);

  dying.remove();
});
