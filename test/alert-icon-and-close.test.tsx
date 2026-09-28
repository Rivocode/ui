import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { CircleX, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "../src/components/alert";
import { RivoProvider } from "../src/provider/rivo-provider";

/*
 * "Color is never the only signal" is a house rule, and the Alert was the piece
 * that depended on it most: four boxes identical in shape, told apart only by
 * tone. The icon already came in - as a child, between the title and the
 * description, with no column of its own and in a different place on each
 * screen -, which is exactly what the rule exists to prevent.
 */

function alert(props: React.ComponentProps<typeof Alert> = {}) {
  return render(
    <RivoProvider scope="local">
      <Alert {...props}>
        <AlertTitle>Certificado vence em 8 dias</AlertTitle>
        <AlertDescription>Renove antes de 01/09.</AlertDescription>
      </Alert>
    </RivoProvider>,
  );
}

test("the icon goes into its own slot, before the text and always in the same place", () => {
  const { container } = alert({ tone: "warning", icon: <TriangleAlert /> });

  const root = screen.getByRole("alert");
  const first = root.firstElementChild!;

  expect(first.querySelector("svg")).not.toBeNull();
  // Before the text in DOM order, and not lost between title and description.
  expect(first.nextElementSibling!.textContent).toContain("Certificado vence");
  expect(container.querySelectorAll("svg")).toHaveLength(1);
});

test("the icon is silent to screen readers: the text beside it already says what it draws", () => {
  alert({ tone: "danger", icon: <CircleX /> });

  const icon = screen.getByRole("alert").firstElementChild!;
  expect(icon.getAttribute("aria-hidden")).toBe("true");
});

test("without an icon, the text is still the first child", () => {
  alert({ tone: "info" });

  const root = screen.getByRole("status");
  expect(root.firstElementChild!.textContent).toContain("Certificado vence");
});

test("title and description stay stacked, with or without an icon", () => {
  alert({ tone: "info", icon: <TriangleAlert /> });

  const column = screen.getByText("Certificado vence em 8 dias").parentElement!;
  expect(column.className.split(" ")).toContain("flex-col");
});

test("onDismiss turns on the close button, and the caller is the one who removes the alert", () => {
  const onDismiss = mock(() => {});
  alert({ tone: "info", onDismiss });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  fireEvent.click(close);

  expect(onDismiss).toHaveBeenCalledTimes(1);
  // The piece holds no state: the alert stays on screen until the caller removes it.
  expect(screen.getByRole("status")).toBeDefined();
});

test("without onDismiss there is no button, which remains the default", () => {
  alert({ tone: "info" });
  expect(screen.queryByRole("button")).toBeNull();
});

test("the close button name is translatable", () => {
  alert({ tone: "info", onDismiss: () => {}, labels: { dismiss: "Dispensar" } });

  expect(screen.getByRole("button", { name: "Dispensar" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "Fechar aviso" })).toBeNull();
});

test("the close button has a visible focus, and not just a faint outline", () => {
  alert({ tone: "info", onDismiss: () => {} });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  expect(close.className).toContain("focus-visible:ring-2");
  expect(close.className).toContain("focus-visible:ring-ring");
});

test("the tone still decides the urgency of the announcement", () => {
  alert({ tone: "danger", icon: <CircleX />, onDismiss: () => {} });
  expect(screen.getByRole("alert")).toBeDefined();
});

test("the consumer's class still wins on the root", () => {
  alert({ tone: "info", className: "rounded-xl", icon: <TriangleAlert /> });

  const root = screen.getByRole("status");
  expect(root.className).toContain("rounded-xl");
  expect(root.className).not.toContain("rounded-lg");
});
