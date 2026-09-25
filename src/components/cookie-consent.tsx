"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";
import type { Slots } from "../lib/slots";
import { Button } from "./button";
import { Link } from "./link";
import { Switch } from "./switch";

export type CookieCategory = {
  /** A chave que volta em `choice.categories`: `analytics`, `marketing`. */
  id: string;
  /** O nome da categoria, na tela. */
  label: ReactNode;
  /** O que ela faz, em uma frase: para que serve e o que guarda. */
  description?: ReactNode;
  /** Sempre ligada e sem chave de desligar: o que o site precisa para funcionar. */
  required?: boolean;
};

export type CookieChoice = {
  /** Qual botao decidiu: `acceptAll`, `rejectOptional` ou `save`, o das escolhas feitas a mao. */
  action: "acceptAll" | "rejectOptional" | "save";
  /** Uma chave por categoria, com `true` para o que foi aceito. As obrigatorias vem sempre `true`. */
  categories: Record<string, boolean>;
};

export const defaultCookieCategories: CookieCategory[] = [
  {
    id: "necessary",
    label: "Necessários",
    description:
      "Fazem o site funcionar: sessão, segurança e as suas preferências, esta escolha inclusive.",
    required: true,
  },
  {
    id: "analytics",
    label: "Análise",
    description: "Contam visitas e medem o uso das páginas, para a gente saber o que melhorar.",
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Mostram anúncios de acordo com os seus interesses, aqui e em outros sites.",
  },
];

const LABELS = {
  title: "Cookies e privacidade",
  description:
    "Usamos cookies necessários para o site funcionar e, com a sua permissão, cookies de análise e de marketing. Você pode mudar a escolha quando quiser.",
  policy: "Política de privacidade",
  acceptAll: "Aceitar todos",
  rejectOptional: "Recusar não essenciais",
  customize: "Personalizar",
  save: "Salvar escolhas",
  required: "sempre ativos",
  categories: "Categorias de cookies",
};

export type CookieConsentProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "title" | "children" | "defaultValue"
> & {
  /**
   * Se o aviso esta na tela. Quem controla e quem usa: abra quando nao ha
   * escolha guardada, ou quando a pessoa pede para rever a dela.
   */
  open: boolean;
  /**
   * Chamado com a escolha, em qualquer um dos tres botoes. A peca nao grava
   * cookie nenhum: guardar a escolha, carregar os scripts aceitos e fechar o
   * aviso (`open={false}`) e trabalho de quem usa.
   */
  onDecision: (choice: CookieChoice) => void;
  /** O endereco da politica de privacidade. O link sai no fim do texto. */
  policyHref: string;
  /**
   * As categorias do "Personalizar". Sem elas, necessarios (obrigatorio),
   * analise e marketing - `defaultCookieCategories`.
   */
  categories?: CookieCategory[];
  /**
   * Como cada chave do "Personalizar" comeca. Sem ele, so as obrigatorias
   * ligadas: a LGPD pede consentimento ativo, e chave que nasce ligada nao e
   * escolha. Passe a escolha guardada quando a pessoa reabre para rever.
   */
  defaultValue?: Record<string, boolean>;
  /** O titulo do aviso. Sem ele, "Cookies e privacidade". */
  title?: ReactNode;
  /** O texto do aviso, antes do link da politica. */
  description?: ReactNode;
  /**
   * Os textos dos botoes e do link: `policy`, `acceptAll`, `rejectOptional`,
   * `customize`, `save`, `required` (o que acompanha a categoria obrigatoria)
   * e `categories`, o nome da lista do "Personalizar".
   */
  labels?: Partial<Omit<typeof LABELS, "title" | "description">>;
  /** Classe por parte: `panel`, `title`, `description`, `policy`, `categories`, `category` e `actions`. */
  classNames?: Slots<
    "panel" | "title" | "description" | "policy" | "categories" | "category" | "actions"
  >;
};

const PANEL_FOCUS = cn(
  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
);

function startingChoice(categories: CookieCategory[], initial?: Record<string, boolean>) {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      category.required ? true : (initial?.[category.id] ?? false),
    ]),
  );
}

export function CookieConsent({
  open,
  onDecision,
  policyHref,
  categories = defaultCookieCategories,
  defaultValue,
  title = LABELS.title,
  description = LABELS.description,
  labels = {},
  className,
  classNames,
  ...props
}: CookieConsentProps) {
  const said = { ...LABELS, ...labels };
  const titleId = useId();
  const descriptionId = useId();
  const listId = useId();

  const [customizing, setCustomizing] = useState(false);
  const [chosen, setChosen] = useState(() => startingChoice(categories, defaultValue));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCustomizing(false);
      setChosen(startingChoice(categories, defaultValue));
    }
  }

  const panel = useRef<HTMLDivElement>(null);
  const before = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      before.current = document.activeElement;
      panel.current?.focus({ preventScroll: true });
      return;
    }
    const active = document.activeElement;
    if (!active || !panel.current?.contains(active)) return;
    const back = before.current;
    if (back instanceof HTMLElement && !focusIsLost(back)) back.focus({ preventScroll: true });
    else panel.current?.blur();
  }, [open]);

  const decide = (action: CookieChoice["action"]) => {
    const everything = action === "acceptAll";
    const categoriesOut = Object.fromEntries(
      categories.map((category) => [
        category.id,
        category.required || (action === "save" ? chosen[category.id] === true : everything),
      ]),
    );
    onDecision({ action, categories: categoriesOut });
  };

  return (
    <div
      {...props}
      data-open={open || undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[var(--rc-z-overlay)] font-sans",
        "px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        inert={!open}
        className={cn(
          "pointer-events-auto mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col gap-4",
          "overflow-y-auto rounded-lg border border-border bg-surface-raised p-4 text-fg shadow-3 sm:p-5",
          PANEL_FOCUS,
          "transition-[opacity,translate,visibility]",
          open
            ? "visible translate-y-0 opacity-100 duration-[var(--rc-duration-base)] ease-rc-enter"
            : "invisible translate-y-4 opacity-0 duration-[var(--rc-duration-fast)] ease-rc-exit",
          classNames?.panel,
        )}
      >
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className={cn("text-base font-rc-medium", classNames?.title)}>
            {title}
          </h2>
          <p id={descriptionId} className={cn("text-sm text-fg-muted", classNames?.description)}>
            {description}{" "}
            <Link href={policyHref} className={classNames?.policy}>
              {said.policy}
            </Link>
          </p>
        </div>

        {customizing && (
          <ul
            id={listId}
            aria-label={said.categories}
            className={cn(
              "flex animate-enter flex-col divide-y divide-border rounded-md border border-border",
              classNames?.categories,
            )}
          >
            {categories.map((category) => {
              const detailId = `${listId}-${category.id}`;
              return (
                <li
                  key={category.id}
                  className={cn("flex flex-col gap-1 px-3 py-3", classNames?.category)}
                >
                  <Switch
                    checked={category.required ? true : chosen[category.id] === true}
                    disabled={category.required}
                    aria-describedby={category.description ? detailId : undefined}
                    onCheckedChange={(checked) =>
                      setChosen((current) => ({ ...current, [category.id]: checked }))
                    }
                    classNames={{ label: "font-rc-medium text-sm" }}
                  >
                    {category.label}
                    {category.required && (
                      <span className="font-rc-regular"> ({said.required})</span>
                    )}
                  </Switch>
                  {category.description && (
                    <p id={detailId} className="pl-13 text-xs text-fg-muted">
                      {category.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row-reverse sm:flex-wrap sm:items-center",
            classNames?.actions,
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button variant="secondary" onClick={() => decide("acceptAll")}>
              {said.acceptAll}
            </Button>
            <Button variant="secondary" onClick={() => decide("rejectOptional")}>
              {said.rejectOptional}
            </Button>
          </div>
          {customizing && (
            <Button variant="secondary" onClick={() => decide("save")}>
              {said.save}
            </Button>
          )}
          <Button
            variant="ghost"
            aria-expanded={customizing}
            aria-controls={customizing ? listId : undefined}
            onClick={() => setCustomizing((current) => !current)}
            className="sm:mr-auto"
          >
            {said.customize}
          </Button>
        </div>
      </div>
    </div>
  );
}
