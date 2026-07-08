# Sistema de tema Light/Dark — Design

Sub-projeto 1 de 5 do pedido de melhorias do Makplan Board (ordem: **tema → animações → fluxo de entrega/reabertura → timer → painel da Diretoria**).

## Contexto

O app hoje só existe em dark mode, com cores hardcoded em hex espalhadas por `App.css`/`index.css` (~1568 linhas). Não há nenhum mecanismo de tema. O objetivo deste sub-projeto é introduzir um modo light equivalente em qualidade visual, com um toggle acessível, sem flash de tema errado no carregamento, e usando uma base de variáveis que os próximos sub-projetos (animações, painel da Diretoria) vão reaproveitar.

## Arquitetura

CSS custom properties + atributo `data-theme="dark" | "light"` no `<html>`. Sem CSS-in-JS, sem duplicar o CSS inteiro em dois arquivos — o projeto usa CSS puro hoje e essa é a extensão natural.

Cores semânticas de marca (`TEAMS`, `LABEL_PALETTE`, vermelho de destaque) não fazem parte do sistema de tema — permanecem como identidade visual fixa. Ajuste de contraste pontual só se algum valor ficar ilegível no fundo claro.

## Tokens

Extrair os hex atuais do `App.css`/`index.css` para variáveis semânticas (não literais), aplicadas nos dois blocos `:root[data-theme="dark"]` / `:root[data-theme="light"]`:

- `--bg-app`, `--bg-surface`, `--bg-surface-raised`
- `--text-primary`, `--text-muted`
- `--border`, `--border-strong`
- `--overlay`
- `--scrollbar-thumb`

Valores dark = os mesmos de hoje (não muda a aparência atual). Valores light = equivalentes com contraste texto/fundo ≥ 4.5:1.

Todo o CSS do app passa a referenciar essas variáveis em vez do hex direto — refactor mecânico, mas abrangente (toca a maior parte do arquivo).

## Toggle e persistência

- Ícone sol/lua no `Header`, ao lado do `user-chip`.
- Preferência em `localStorage` (chave `makplan-theme`), fallback **dark** por padrão.
- Script síncrono em `index.html`, antes do bundle React, lê `localStorage` e já aplica `data-theme` no `<html>` — evita flash do tema errado na primeira pintura.
- Troca de tema anima via `transition: background-color .25s ease, color .25s ease, border-color .25s ease` nos elementos-chave (sem "salto" brusco).

## Fundo customizado do workspace

- Nova constante `WORKSPACE_BG_PALETTE_LIGHT`: mesmos 5 nomes de `WORKSPACE_BG_PALETTE` (Vermelho Makplan, Grafite, Azul-noite, Verde-musgo, Roxo-escuro), com tons claros equivalentes e texto legível.
- `ProfileModal` mostra a paleta correspondente ao tema ativo no momento. A cor salva em `profiles.bg_color` é mapeada pelo nome da opção para o par claro/escuro certo ao trocar de tema — a escolha da pessoa (ex: "Azul-noite") persiste conceitualmente entre os dois modos.

## Escopo

**Toca:** `index.css`, `App.css` (maior parte do arquivo), `Header.tsx` (novo botão), `ProfileModal.tsx` (paleta condicional por tema), `constants.ts` (nova paleta clara), `index.html` (script anti-flash), novo hook `useTheme.ts`.

**Não toca:** lógica de negócio, schema Supabase, animações dos cards (sub-projeto seguinte), fluxo de entrega/timer/painel da Diretoria.

## Verificação

Sem testes automatizados no projeto (não há suíte configurada). Verificação manual: abrir o app no navegador, alternar o tema em todas as telas (board, dashboard "Visão geral", CardModal, ManageModal, ProfileModal, AuthScreen) e conferir contraste e legibilidade em ambos os modos.
