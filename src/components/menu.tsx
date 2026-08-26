"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";

export const Menu = BaseMenu.Root;

export function MenuTrigger({ className, ...props }: ComponentProps<typeof BaseMenu.Trigger>) {
  return (
    <BaseMenu.Trigger
      {...props}
      className={cn(
        // Ele sai sem PELE de proposito - o uso comum e `render={<Button />}`, e
        // duas fontes de estilo brigariam. Foco nao e pele: `outline-none`
        // sozinho nao e "sem estilo", e remocao ativa do unico sinal que o
        // navegador da de graca. Quando o gatilho e escrito na mao, como na
        // barra de menus, o anel daqui e o unico que existe; quando ele vem de
        // um Button, o anel e o mesmo e as classes se fundem sem dobrar.
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    />
  );
}

/**
 * Casca compartilhada de tudo que flutua: portal com o tema, posicionamento e
 * o painel. Menu, Select e Tooltip usam a mesma linguagem visual de proposito.
 */
export const floatingPanel = cn(
  "min-w-[8rem] max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-surface-raised p-1 shadow-3",
  "font-sans text-fg outline-none",
  "origin-[var(--transform-origin)] transition-[opacity,transform]",
  "duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
  "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
  "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
);

export type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> & FloatingPositionProps;

export function MenuContent({
  className,
  children,
  sideOffset = FLOATING_SIDE_OFFSET,
  side,
  align,
  ...props
}: MenuContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseMenu.Portal container={portalContainer ?? undefined}>
      <BaseMenu.Positioner
        sideOffset={sideOffset}
        side={side}
        align={align}
        collisionPadding={8}
        className="z-[var(--rc-z-dropdown)] outline-none"
      >
        <BaseMenu.Popup {...props} className={cn(floatingPanel, className)}>
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export const menuItemVariants = cva(
  cn(
    "flex cursor-default items-center gap-2 rounded-sm px-2.5 text-base",
    "py-[var(--rc-item-y)]",
    "outline-none select-none",
    "data-[highlighted]:bg-accent-subtle",
    "data-[disabled]:text-fg-disabled data-[disabled]:data-[highlighted]:bg-transparent",
  ),
  {
    variants: {
      tone: {
        neutral: "text-fg",
        danger: "text-danger-text data-[highlighted]:bg-danger-subtle",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type MenuItemProps = ComponentProps<typeof BaseMenu.Item> &
  VariantProps<typeof menuItemVariants>;

export function MenuItem({ className, tone, ...props }: MenuItemProps) {
  return <BaseMenu.Item {...props} className={cn(menuItemVariants({ tone }), className)} />;
}

export function MenuSeparator({ className, ...props }: ComponentProps<typeof BaseMenu.Separator>) {
  return <BaseMenu.Separator {...props} className={cn("my-1 h-px bg-border", className)} />;
}

/**
 * O titulo de um grupo dentro de um painel que flutua.
 *
 * Mora aqui, junto da `floatingPanel`, porque o Menu, o Select e o Combobox
 * mostram a mesma lista com as mesmas familias e o cabecalho delas nao pode
 * mudar de peso de uma peca para a outra - as tres aparecem na mesma tela de
 * filtro. O do Combobox nasceu sem estilo nenhum e por isso saia com o mesmo
 * tamanho dos itens: o cabecalho lia-se como opcao.
 */
export const floatingGroupLabel =
  "px-2.5 py-1.5 text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase";

export type MenuGroupProps = ComponentProps<typeof BaseMenu.Group> & {
  /** Titulo do grupo. Sem ele o grupo apenas agrupa. */
  label?: string;
  /** Classe por parte: `label`, o titulo do grupo. */
  classNames?: Slots<"label">;
};

/**
 * Grupo de itens com titulo. O rotulo e o grupo vem juntos de proposito: a
 * Base UI exige que o rotulo viva dentro de um grupo, e expor as duas pecas
 * separadas so criava uma forma de usar errado que quebra na tela, nao no
 * teste de tipo.
 */
export function MenuGroup({ className, classNames, label, children, ...props }: MenuGroupProps) {
  return (
    <BaseMenu.Group {...props} className={className}>
      {label && (
        <BaseMenu.GroupLabel className={cn(floatingGroupLabel, classNames?.label)}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

/**
 * A coluna da marca, do lado esquerdo do item que se liga e desliga.
 *
 * O indicador da Base UI so monta quando o item esta marcado, entao ele nao
 * pode ser o dono do espaco: sem uma coluna que existe sempre, ligar uma
 * coluna do menu de "Colunas" empurrava o texto de todas as outras para o
 * lado a cada clique. E a mesma largura do indicador do `SelectItem` e do
 * `ComboboxItem`, para as tres listas alinharem o texto na mesma coluna.
 */
const markColumn = cn(
  "flex size-4 shrink-0 items-center justify-center text-accent-text",
  // A marca apaga junto com o item, como a do Checkbox e a do Radio: verde
  // cheio ao lado de um texto apagado se le como "ligado e clicavel", e a
  // coluna que nao pode ser desligada era justamente a que ficava mais viva.
  // O estado mora no item, e nao aqui, entao ele chega por grupo nomeado.
  "group-data-[disabled]/item:text-fg-disabled",
);

export type MenuCheckboxItemProps = ComponentProps<typeof BaseMenu.CheckboxItem> &
  VariantProps<typeof menuItemVariants> & {
    /** Classe por parte: `indicator`, a coluna que guarda a marca. */
    classNames?: Slots<"indicator">;
  };

/**
 * Item de menu que liga e desliga uma opcao, sem sair do menu.
 *
 * E o "quais colunas mostrar" de uma listagem. O caminho que sobrava era um
 * `Popover` com `Checkbox` dentro, e ele custava as duas coisas que so o menu
 * da: o `aria-checked` que o leitor de tela le, e a navegacao por seta e por
 * letra que a lista de menu ja tem.
 *
 * O menu NAO fecha ao marcar - `closeOnClick` e `false`, como na Base UI -,
 * porque quem escolhe colunas escolhe varias de uma vez.
 */
export function MenuCheckboxItem({
  className,
  classNames,
  tone,
  children,
  ...props
}: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      {...props}
      className={cn(menuItemVariants({ tone }), "group/item", className)}
    >
      <span className={cn(markColumn, classNames?.indicator)}>
        <BaseMenu.CheckboxItemIndicator>
          <Check size={14} aria-hidden="true" />
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

export type MenuRadioGroupProps = ComponentProps<typeof BaseMenu.RadioGroup> & {
  /** Titulo do grupo: "Ordenar por". Sem ele o grupo apenas agrupa. */
  label?: string;
  /** Classe por parte: `label`, o titulo do grupo. */
  classNames?: Slots<"label">;
};

/**
 * Grupo de escolha unica dentro do menu, e quem guarda o valor escolhido.
 *
 * O rotulo vem no `label`, pelo mesmo motivo do `MenuGroup`: a Base UI liga o
 * `aria-labelledby` do grupo ao titulo que vive dentro dele, e um titulo
 * escrito por fora nao nomeia grupo nenhum.
 */
export function MenuRadioGroup({
  className,
  classNames,
  label,
  children,
  ...props
}: MenuRadioGroupProps) {
  return (
    <BaseMenu.RadioGroup {...props} className={className}>
      {label && (
        <BaseMenu.GroupLabel className={cn(floatingGroupLabel, classNames?.label)}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.RadioGroup>
  );
}

export type MenuRadioItemProps = ComponentProps<typeof BaseMenu.RadioItem> &
  VariantProps<typeof menuItemVariants> & {
    /** Classe por parte: `indicator`, a coluna que guarda o ponto. */
    classNames?: Slots<"indicator">;
  };

/**
 * Uma opcao de escolha unica no menu: "Ordenar por data", "por valor".
 *
 * O ponto no lugar da marca nao e decoracao - ele diz que escolher esta
 * desescolhe a de cima, o que a marca de certo nao diz.
 *
 * Como na Base UI, escolher NAO fecha o menu. Quando a escolha encerra o
 * assunto - e ordenar costuma encerrar -, passe `closeOnClick`.
 */
export function MenuRadioItem({
  className,
  classNames,
  tone,
  children,
  ...props
}: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      {...props}
      className={cn(menuItemVariants({ tone }), "group/item", className)}
    >
      <span className={cn(markColumn, classNames?.indicator)}>
        <BaseMenu.RadioItemIndicator
          className={cn(
            "size-1.5 rounded-pill bg-accent-text",
            "group-data-[disabled]/item:bg-fg-disabled",
          )}
        />
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </BaseMenu.RadioItem>
  );
}

/**
 * O submenu: um ramo do menu que abre ao lado.
 *
 * Nao pinta elemento nenhum - e so estado. Dentro dele vao o
 * `MenuSubmenuTrigger`, que e o item que abre, e um `MenuContent`, que e o
 * mesmo painel do menu de cima. O lado nao precisa ser pedido: a Base UI abre
 * o ramo em `inline-end` quando o pai e um menu, e vira sozinho quando nao
 * cabe.
 *
 * Um nivel resolve quase tudo. Dois ja e uma arvore, e arvore com o mouse em
 * cima e como perder a linha ao andar na diagonal: prefira `Dialog` ou uma
 * tela propria.
 */
export const MenuSubmenu = BaseMenu.SubmenuRoot;

export type MenuSubmenuTriggerProps = ComponentProps<typeof BaseMenu.SubmenuTrigger> & {
  /** Classe por parte: `indicator`, a seta que aponta para o ramo. */
  classNames?: Slots<"indicator">;
};

/** O item que abre o submenu, com a seta que avisa que ha mais adiante. */
export function MenuSubmenuTrigger({
  className,
  classNames,
  children,
  ...props
}: MenuSubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger
      {...props}
      // O ramo aberto continua aceso enquanto o mouse esta la dentro: sem
      // isso, o realce sai do item assim que o ponteiro entra no submenu e
      // nada mais liga o painel filho ao item que o abriu.
      className={cn(menuItemVariants(), "data-[popup-open]:bg-accent-subtle", className)}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className={cn("shrink-0 text-fg-subtle", classNames?.indicator)}
      />
    </BaseMenu.SubmenuTrigger>
  );
}

export type MenuLinkItemProps = ComponentProps<typeof BaseMenu.LinkItem>;

/**
 * Item de menu que navega, e por isso sai como `<a>` de verdade.
 *
 * O que se ganha e o que so a ancora tem: o botao do meio abre em outra aba, o
 * botao direito copia o endereco, e a barra do navegador mostra para onde o
 * item leva antes do clique. Nada disso existe num `MenuItem` com `onClick`
 * que chama o roteador.
 *
 * O padrao de `closeOnClick` e `true` aqui, e na Base UI e `false`. O motivo e
 * o roteador de uma pagina so: com navegacao pelo cliente o menu nao e
 * desmontado por ninguem, entao ele ficava aberto flutuando sobre a tela nova.
 * Quem quiser o comportamento da Base UI passa `closeOnClick={false}`.
 */
export function MenuLinkItem({ className, closeOnClick = true, ...props }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem
      {...props}
      closeOnClick={closeOnClick}
      className={cn(menuItemVariants(), "no-underline", className)}
    />
  );
}
