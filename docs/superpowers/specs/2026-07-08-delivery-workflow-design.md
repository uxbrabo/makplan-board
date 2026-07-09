# Fluxo de entrega e reabertura — Design

Sub-projeto 3 de 5. Ordem geral: tema (feito) → micro-interações (feito) → drag-and-drop premium (feito) → **fluxo de entrega/reabertura (este spec)** → painel da Diretoria. Cronômetro confirmado sem necessidade de mudança de código (ver abaixo).

## Contexto

O board já tem uma coluna "Entregue" (`ColumnId`). O pedido: um botão explícito "Tarefa concluída" no card, que move pro "Entregue" automaticamente com transição suave; um selo verde visível no card fechado; e um botão "Mover para Ajuste" ao reabrir um card entregue, que desmarca o selo e volta o card pra "Ajustes".

## Decisão principal: reaproveitar `col` como sinal de "entregue"

Não é criado nenhum campo novo no banco. "Entregue" = `card.col === "entregue"`. Isso significa:
- O botão "Tarefa concluída" só chama `onUpdate({ col: "entregue" })` — mutação que já existe (`updateCard` em `useSupabaseBoard.ts`, já plugada em `CardModal`).
- O botão "Mover para Ajuste" só chama `onUpdate({ col: "ajustes" })`.
- A "transição suave" ao mudar de coluna já acontece automaticamente: `Board.tsx` já anima cards saindo/entrando de coluna via `AnimatePresence` sempre que `card.col` muda (mecanismo usado tanto pelo drag quanto por qualquer update direto) — nenhum código de animação novo é necessário.
- O selo "Entregue" no card fechado é puramente derivado de `card.col === "entregue"` — some sozinho assim que o card sai dessa coluna (por drag ou pelo botão "Mover para Ajuste"), sem precisar zerar nenhum campo.

## Regra de exibição dos botões

Confirmado: sem detecção de edição. `card.col !== "entregue"` → mostra "✓ Tarefa concluída". `card.col === "entregue"` → mostra "↩ Mover para Ajuste". Simples, baseado só na coluna atual.

## UI

- **`CardModal`**: botão de ação em destaque, logo abaixo do campo de título (acima do bloco de prazo), ocupando a largura disponível — mesmo nível de destaque visual do `timer-block`, já que é uma ação de fluxo de trabalho significativa (ajuste em relação à primeira proposta, que colocava o botão apertado na barra de topo).
- **`CardItem`** (card fechado): selo verde "✓ Entregue" na área de meta-informações do card (junto a due-chip/check-progress/comment-count), visível só quando `card.col === "entregue"`, reaproveitando o verde já usado em `.due-chip.due-entregue`/`.timer-value`/`.stat-value.stat-green`.

## Cronômetro

Confirmado: nenhuma mudança de código. O modal (`CardModal`) já mostra minuto:segundo exato sempre (`formatCardTime(card, now, true)`, hardcoded). O card fechado mantém a preferência de densidade já existente (`tweaks.mostrarSegundos`).

## Escopo

**Toca:** `client/src/components/CardModal.tsx` (novo botão de ação), `client/src/components/CardItem.tsx` (selo de entregue), `client/src/App.css` (estilos do botão de ação e do selo).

**Não toca:** schema do Supabase, lógica de drag-and-drop, tema, micro-interações, cronômetro, painel da Diretoria.

## Verificação

Sem suíte de testes automatizados. `npm run build` + checklist manual: marcar um card como concluído em cada coluna de origem, conferir a transição e o selo, reabrir um card entregue e mover pra ajuste, conferir que o selo some.
