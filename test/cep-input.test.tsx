import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

import { Field, FieldDescription, FieldLabel, Input } from "../src/components/field";
import {
  PostalCodeField,
  type PostalCodeFieldProps,
} from "../src/components/postal-code-field";
import { Form } from "../src/form/form";
import { FormField } from "../src/form/form-field";
import { useZodForm } from "../src/form/use-zod-form";
import { RivoProvider } from "../src/provider/rivo-provider";
import type { PostalAddress } from "../src/shared/postal-code";

const AURORA: PostalAddress = {
  street: "Avenida Epitácio Pessoa",
  district: "Tambaú",
  city: "João Pessoa",
  state: "PB",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function field(props: Partial<PostalCodeFieldProps> = {}) {
  const view = render(
    <RivoProvider scope="local">
      <Field>
        <FieldLabel>CEP</FieldLabel>
        <PostalCodeField lookup={async () => null} {...props} />
        <FieldDescription>Só os números.</FieldDescription>
      </Field>
    </RivoProvider>,
  );
  const input = screen.getByLabelText("CEP") as HTMLInputElement;
  const root = view.container.querySelector("[data-status]") as HTMLElement;
  const status = view.container.querySelector("[role='status'][aria-live='polite']") as HTMLElement;
  return { ...view, input, root, status };
}

const type = (input: HTMLInputElement, text: string) => fireEvent.change(input, { target: { value: text } });

test("applies the 99999-999 mask, opens the numeric keyboard and asks for browser autofill", () => {
  const onValueChange = mock((_masked: string, _digits: string) => {});
  const { input } = field({ onValueChange });

  type(input, "58038000");

  expect(input.value).toBe("58038-000");
  expect(input.getAttribute("inputmode")).toBe("numeric");
  expect(input.getAttribute("autocomplete")).toBe("postal-code");
  expect(onValueChange).toHaveBeenLastCalledWith("58038-000", "58038000");
});

test("only looks up after completing the 8 digits, and only once", async () => {
  const lookup = mock(async (_postalCode: string) => null);
  const { input } = field({ lookup });

  type(input, "5803800");
  expect(lookup).not.toHaveBeenCalled();

  await act(async () => type(input, "58038000"));
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(lookup.mock.calls[0]![0]).toBe("58038000");

  await act(async () => type(input, "58038-000"));
  expect(lookup).toHaveBeenCalledTimes(1);
});

test("a CEP pasted with a dot is not truncated by the browser, and the lookup runs", async () => {
  const lookup = mock(async (_postalCode: string) => null);
  const { input } = field({ lookup });

  expect(input.hasAttribute("maxlength")).toBe(false);

  await act(async () => type(input, "01.310-100"));
  expect(input.value).toBe("01310-100");
  expect(lookup).toHaveBeenCalledTimes(1);
  expect(lookup.mock.calls[0]![0]).toBe("01310100");
});

test("while looking up: spinner in the suffix, aria-busy and the waiting announcement", async () => {
  const pending = deferred<PostalAddress | null>();
  const { input, root, status } = field({ lookup: () => pending.promise });

  await act(async () => type(input, "58038000"));

  expect(root.getAttribute("data-status")).toBe("searching");
  expect(input.getAttribute("aria-busy")).toBe("true");
  expect(root.querySelector("svg.animate-spin")).not.toBeNull();
  expect(status.textContent).toBe("Buscando endereço…");

  await act(async () => pending.resolve(AURORA));
  expect(root.getAttribute("data-status")).toBe("found");
  expect(input.hasAttribute("aria-busy")).toBe(false);
  expect(root.querySelector("svg.animate-spin")).toBeNull();
});

test("found: onAddress receives the address and the CEP, and the reader hears it was found", async () => {
  const onAddress = mock((_address: PostalAddress, _postalCode: string) => {});
  const { input, root, status } = field({ lookup: async () => AURORA, onAddress });

  await act(async () => type(input, "58038000"));

  expect(onAddress).toHaveBeenCalledWith(AURORA, "58038000");
  expect(root.getAttribute("data-status")).toBe("found");
  expect(status.textContent).toBe("Endereço encontrado.");
  expect(input.hasAttribute("aria-invalid")).toBe(false);
});

test("not found: an error in Portuguese, linked to the field, and the field marks itself invalid", async () => {
  const onAddress = mock(() => {});
  const { input, root, status } = field({ lookup: async () => null, onAddress });

  await act(async () => type(input, "99999999"));

  const message = root.querySelector("p") as HTMLElement;
  expect(message.textContent).toMatch(/^CEP não encontrado/);
  expect(root.getAttribute("data-status")).toBe("notFound");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-describedby")!.split(" ")).toContain(message.id);
  expect(message.className.split(" ")).toContain("text-danger-text");
  expect(input.className.split(" ")).toContain("border-danger");
  expect(status.textContent).toBe(message.textContent);
  expect(onAddress).not.toHaveBeenCalled();
});

test("a network failure is not the CEP's fault: it warns, offers retry and does not mark invalid", async () => {
  let calls = 0;
  const lookup = mock(async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Failed to fetch");
    return AURORA;
  });
  const onAddress = mock(() => {});
  const { input, root } = field({ lookup, onAddress });

  await act(async () => type(input, "58038000"));

  expect(root.getAttribute("data-status")).toBe("failed");
  expect(root.querySelector("p")!.textContent).toMatch(/^Não foi possível buscar o CEP/);
  expect(input.hasAttribute("aria-invalid")).toBe(false);

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" })));

  expect(lookup).toHaveBeenCalledTimes(2);
  expect(onAddress).toHaveBeenCalledWith(AURORA, "58038000");
  expect(root.getAttribute("data-status")).toBe("found");
  expect(root.querySelector("p")).toBeNull();
});

test("retry leaves focus on the field, and not on the page body", async () => {
  const pending = deferred<PostalAddress | null>();
  let calls = 0;
  const lookup = mock(() => {
    calls += 1;
    return calls === 1 ? Promise.reject(new TypeError("Failed to fetch")) : pending.promise;
  });
  const { input, root } = field({ lookup });

  await act(async () => type(input, "58038000"));
  const retry = screen.getByRole("button", { name: "Tentar de novo" });
  retry.focus();
  expect(document.activeElement === retry).toBe(true);

  await act(async () => fireEvent.click(retry));

  expect(root.getAttribute("data-status")).toBe("searching");
  expect(retry.isConnected).toBe(false);
  expect(document.activeElement === input).toBe(true);
});

test("with reduced motion, looking up has visible text, because the spinner stops", async () => {
  const pending = deferred<PostalAddress | null>();
  const { input, root } = field({ lookup: () => pending.promise });

  await act(async () => type(input, "58038000"));

  const visible = [...root.querySelectorAll("[data-searching]")];
  expect(visible).toHaveLength(1);
  expect(visible[0]!.textContent).toBe("Buscando endereço…");
  expect(visible[0]!.getAttribute("aria-hidden")).toBe("true");
  expect(visible[0]!.className.split(" ")).toContain("motion-reduce:block");
  expect(visible[0]!.className.split(" ")).toContain("hidden");
  expect(visible[0]!.closest(".sr-only")).toBeNull();

  await act(async () => pending.resolve(AURORA));
  expect(root.querySelector("[data-searching]")).toBeNull();
});

test("changing the CEP mid-lookup cancels the previous one, and the stale response does not get in", async () => {
  const first = deferred<PostalAddress | null>();
  const second = deferred<PostalAddress | null>();
  const signals: AbortSignal[] = [];
  const answers = [first, second];
  const lookup = mock((_postalCode: string, signal: AbortSignal) => {
    signals.push(signal);
    return answers[signals.length - 1]!.promise;
  });
  const onAddress = mock((_address: PostalAddress, _postalCode: string) => {});
  const { input, root } = field({ lookup, onAddress });

  await act(async () => type(input, "58038000"));
  await act(async () => type(input, "01310100"));

  expect(signals).toHaveLength(2);
  expect(signals[0]!.aborted).toBe(true);
  expect(signals[1]!.aborted).toBe(false);

  const paulista = { street: "Avenida Paulista", district: "Bela Vista", city: "São Paulo", state: "SP" };
  await act(async () => first.resolve(AURORA));
  expect(onAddress).not.toHaveBeenCalled();
  expect(root.getAttribute("data-status")).toBe("searching");

  await act(async () => second.resolve(paulista));
  expect(onAddress).toHaveBeenCalledTimes(1);
  expect(onAddress).toHaveBeenCalledWith(paulista, "01310100");
});

test("deleting a digit cancels the lookup and clears the notice", async () => {
  const pending = deferred<PostalAddress | null>();
  const onStatusChange = mock((_status: string) => {});
  const { input, root } = field({ lookup: () => pending.promise, onStatusChange });

  await act(async () => type(input, "58038000"));
  await act(async () => type(input, "5803800"));

  expect(root.getAttribute("data-status")).toBe("idle");
  expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(["searching", "idle"]);

  await act(async () => pending.resolve(AURORA));
  expect(root.getAttribute("data-status")).toBe("idle");
});

test("the initial value does not trigger a lookup", async () => {
  const lookup = mock(async () => AURORA);
  const { input } = field({ lookup, defaultValue: "58038000" });

  await act(async () => {});
  expect(input.value).toBe("58038-000");
  expect(lookup).not.toHaveBeenCalled();
});

test("inside Field, the description and the notice describe the field together", async () => {
  const { input, root } = field({ lookup: async () => null });
  const description = screen.getByText("Só os números.");

  await act(async () => type(input, "99999999"));

  const ids = input.getAttribute("aria-describedby")!.split(" ");
  expect(description.id).toBeTruthy();
  expect(ids).toContain(description.id);
  expect(ids).toContain(root.querySelector("p")!.id);
});

const schema = z.object({
  postalCode: z.string().length(8, "Escreva os 8 números do CEP"),
  street: z.string(),
  city: z.string(),
});

function Address() {
  const form = useZodForm(schema, { defaultValues: { postalCode: "", street: "", city: "" } });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="postalCode" label="CEP">
          {(row) => (
            <PostalCodeField
              name={row.name}
              value={row.value}
              onBlur={row.onBlur}
              onValueChange={(_masked, digits) => row.onChange(digits)}
              lookup={async () => AURORA}
              onAddress={(address) => {
                form.setValue("street", address.street);
                form.setValue("city", address.city);
              }}
            />
          )}
        </FormField>
        <FormField name="street" label="Rua">
          {(row) => <Input {...row} />}
        </FormField>
        <FormField name="city" label="Cidade">
          {(row) => <Input {...row} />}
        </FormField>
      </Form>
    </RivoProvider>
  );
}

test("with FormField, the found address fills the rest of the form", async () => {
  render(<Address />);
  const input = screen.getByLabelText("CEP") as HTMLInputElement;

  await act(async () => type(input, "58038000"));

  await waitFor(() => expect((screen.getByLabelText("Rua") as HTMLInputElement).value).toBe(AURORA.street));
  expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe("João Pessoa");
  expect(input.value).toBe("58038-000");
});
