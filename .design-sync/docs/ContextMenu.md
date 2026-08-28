---
category: Sobreposição
---

# ContextMenu

O menu do botão direito.

O conteúdo e o mesmo do `Menu`: use `MenuContent`, `MenuItem`, `MenuGroup` e
`MenuSeparator` dentro dele. Só o gatilho muda, porque aqui quem abre e a área
inteira, e não um botão.

**Nunca deixe uma ação existir só aqui.** Quem navega por teclado depende da
tecla de menu, que nem todo teclado tem, e num navegador de celular não ha botão
direito. Ele acelera o que já esta em outro lugar, no menu de ações da linha,
por exemplo.

No React Native o mesmo caso existe, e o gesto muda: o `Menu` do
`@rivocode/ui-native` abre no toque longo da área que você passar como
`children`. A seção do fim desta pagina diz como.

```tsx
<ContextMenu>
  <ContextMenuTrigger className="rounded-md border border-dashed p-6">
    Clique com o botao direito
  </ContextMenuTrigger>
  <MenuContent>
    <MenuItem>Baixar PDF</MenuItem>
    <MenuItem>Duplicar</MenuItem>
    <MenuSeparator />
    <MenuItem tone="danger">Cancelar nota</MenuItem>
  </MenuContent>
</ContextMenu>
```

## No React Native

Vira `Menu`, e não peça nova: o menu do botão direito é, no celular, o toque longo, e quem abre a folha de ações já é o `Menu`. Passe a área alvo como `children` dele — o que no web é o `ContextMenuTrigger` — e ela chama `onOpenChange(true)` no toque longo, com `triggerClassName` para o layout que os filhos exigem. Quem navega por leitor de tela entra pela mesma porta: a área expõe a ação `longpress`, que o VoiceOver e o TalkBack oferecem no menu de ações, então o gesto nunca é o único caminho.
