# Drag-and-drop premium — Design

Sub-projeto 2b de um total maior. Ordem geral do pedido original: tema (feito) → micro-interações (feito) → **drag-and-drop premium (este spec)** → fluxo de entrega/reabertura → timer → painel da Diretoria.

## Contexto

O drag-and-drop hoje usa a API nativa do navegador (HTML5 `draggable`/`onDragStart`/`onDragOver`/`onDrop`, em `Board.tsx`/`CardItem.tsx`): funciona, mas o "fantasma" arrastado é o visual padrão feio do navegador, sem sombra/elevação, sem prévia suave de reordenação, e o soltar salva no Supabase antes de atualizar a tela (pequeno atraso visível). Objetivo: drag-and-drop nível Trello/Linear — card levanta com sombra ao arrastar, os outros cards se afastam suavemente pra abrir espaço, soltar responde instantaneamente.

## Arquitetura

Adiciona `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` como novas dependências — biblioteca padrão para drag-and-drop multi-container em React, com detecção de colisão, reordenação entre listas e suporte a teclado (acessibilidade) resolvidos pela lib.

- `Board.tsx` envolve as colunas num `DndContext` (sensor `PointerSensor`, `activationConstraint: { distance: 8 }` para distinguir clique-pra-abrir de arraste) e cada coluna vira um `SortableContext` com os IDs dos cards daquela coluna.
- Novo componente `client/src/components/SortableCard.tsx`: wrapper fino usando `useSortable({ id: card.id })`, aplica `attributes`/`listeners`/`setNodeRef` e o `transform`/`transition` do dnd-kit ao elemento — isso é o que anima os outros cards se afastando suavemente durante o arraste. `CardItem` continua sem saber nada sobre drag-and-drop, só recebe props.
- Um `DragOverlay` (do dnd-kit) renderiza a cópia "levantada" do card sendo arrastado, seguindo o cursor, reaproveitando a sombra/escala já definida no sub-projeto de micro-interações (`0 10px 24px -8px rgba(0, 0, 0, 0.35)`).

**Decisão importante:** a prop `layout` do Framer Motion sai do `motion.div` que envolve cada card (adicionada no sub-projeto de micro-interações para animar reposicionamento) — ela e o `transform`/`transition` do dnd-kit disputariam o controle do mesmo elemento, causando conflito/tremulação. O dnd-kit passa a ser o único responsável pelo reposicionamento durante o arraste. O Framer Motion (`AnimatePresence` + `initial`/`animate`/`exit`) continua responsável só pela entrada/saída de cards (criar/excluir) — animação diferente, sem conflito. `whileHover`/`whileTap` (feedback de mouse parado, sem arrastar) continuam no card normalmente.

## Drop otimista

`moveCard` em `useSupabaseBoard.ts` hoje segue o padrão de toda mutação do hook: escreve no Supabase → `fetchAll()` → só então a tela atualiza. Isso muda só para `moveCard`:

1. Ao soltar, atualiza o estado local `cards` imediatamente (nova `col`/posição) — a tela responde na hora, sem esperar o servidor.
2. Dispara as escritas no Supabase em segundo plano (mesma lógica de recalcular posição dos irmãos que já existe).
3. Se a escrita falhar, desfaz a mudança local (volta o card pro estado anterior) e mostra uma mensagem de erro, seguindo o padrão de erro já usado em outros lugares do app (ex: `attachmentError` em `CardModal`).
4. Se der certo, não há `fetchAll()` — o estado local já está correto; a assinatura `postgres_changes` já existente mantém tudo sincronizado se outra pessoa mexer no quadro ao mesmo tempo.

Nenhuma outra mutação do hook muda — só `moveCard`.

## Comportamento do arraste

- Segurar e mover um card faz os outros cards da coluna (e da coluna de destino, se cruzar) se afastarem suavemente pra abrir espaço — essa movimentação em si já é a "prévia" de onde o card vai encaixar (padrão Trello/Linear); não há elemento visual extra tipo contorno tracejado.
- Soltar numa coluna vazia ou abaixo do último card manda pro fim daquela coluna — mesmo comportamento de hoje.
- Cancelar o arraste (tecla Esc, ou soltar fora de qualquer coluna/área de drop válida) devolve o card pro lugar original sem persistir nada.
- Navegação por teclado (ativar arraste, mover entre posições, soltar) vem incluída pelo dnd-kit por padrão ao usar `useSortable`/`KeyboardSensor` — ganho de acessibilidade que não exige trabalho extra além de registrar o sensor.

## Escopo

**Toca:** `client/package.json` (novas dependências), `client/src/components/Board.tsx`, `client/src/components/CardItem.tsx` (remove drag nativo), novo `client/src/components/SortableCard.tsx`, `client/src/useSupabaseBoard.ts` (`moveCard` otimista).

**Não toca:** tema, as demais micro-interações (hover/press de botões, chips, modais — já feitas), fluxo de entrega/reabertura, cronômetro, painel da Diretoria.

## Verificação

Sem suíte de testes automatizados no projeto. `npm run build` (checagem de tipos) + checklist manual: arrastar dentro da mesma coluna, entre colunas diferentes, pra uma coluna vazia, cancelar com Esc, e testar em ambos os temas (light/dark). Mesma ressalva das sub-projetos anteriores: sem acesso a navegador nesta sessão — o teste visual ao vivo fica pendente para verificação humana antes do merge.
