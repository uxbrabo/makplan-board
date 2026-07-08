# Micro-interações e transições gerais — Design

Sub-projeto 2a de um total maior (animações foi dividido em 2a "micro-interações gerais" e 2b "drag-and-drop premium", que vem em seguida). Ordem geral do pedido original: tema (feito) → **micro-interações (este spec)** → drag-and-drop premium → fluxo de entrega/reabertura → timer → painel da Diretoria.

## Contexto

O app hoje usa `motion` (Framer Motion) só em cards e modais, com valores de spring soltos e diferentes em cada arquivo (`Board.tsx`: `stiffness: 500, damping: 38`; `CardModal.tsx`: `stiffness: 420, damping: 34`). A maioria dos elementos interativos — botões, chips, toggles, inputs — não tem nenhuma transição: mudança de estado é instantânea (`grep` confirma zero `transition` nessas classes antes deste trabalho, fora as adicionadas pelo sub-projeto de tema). Não existe `:focus-visible` padronizado fora do formulário de login, nem suporte a `prefers-reduced-motion`.

Objetivo: uma linguagem de movimento única e consistente — "estilo iOS", contida (não bouncy exagerado) — aplicada de forma sistemática a todo elemento interativo existente, sem introduzir nova dependência.

## Arquitetura

Um módulo central de tokens de movimento, consumido tanto por CSS puro quanto por Framer Motion:

- **`client/src/motion.ts`** (novo): exporta os presets de spring do Framer Motion como objetos `Transition` prontos — `springSnappy`, `springSmooth`, `springGentle` — para uso em `motion.div`/`AnimatePresence`/`whileHover`/`whileTap` nos componentes que já usam a lib (Board, CardItem, CardModal, ManageModal, ProfileModal).
- **CSS custom properties em `client/src/index.css`** (fora dos blocos `data-theme`, já que não variam por tema): `--ease-snappy`, `--ease-smooth` (cubic-bezier equivalentes aos springs acima), `--duration-fast` (~120ms), `--duration-base` (~200ms) — para transições CSS puras em elementos que não são `motion.*` (botões, inputs, chips, o ícone do toggle de tema).
- Bloco global `@media (prefers-reduced-motion: reduce)` em `index.css` reduzindo durações a ~0 e removendo `whileHover`/`whileTap`/springs não essenciais.

## Valores dos presets

- **`snappy`** — feedback imediato (hover/press em botões, chips, toggles, checkboxes, foco de input): spring `{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }`; CSS `cubic-bezier(0.22, 1, 0.36, 1)`, ~120-150ms.
- **`smooth`** — entrada/saída de modais, painéis, dropdown de menção: spring `{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }`.
- **`gentle`** — mudança de layout maior (card trocando de coluna, entrada/saída de cards na lista): spring `{ type: "spring", stiffness: 300, damping: 32, mass: 0.8 }`.

Contido de propósito — sem overshoot exagerado, consistente com o próprio sistema de animação do iOS (que é majoritariamente crítico/bem amortecido, não "elástico").

## Escopo por categoria

- **Botões** (`.manage-btn`, `.tab`, `.team-chip`, `.close-btn`, `.delete-btn`, `.timer-btn`, `.theme-toggle-btn`, `.add-icon-btn`, botões de checklist/comentário/anexo/formulário): `transition` com `--ease-snappy`/`--duration-fast` em `background-color`, `border-color`, `color`, `transform`; `:hover` com leve `scale`/mudança de cor; `:active` com `scale` reduzido (feedback de "press").
- **Checkboxes/toggles** (checklist, tema): transição de cor com `snappy`; o toggle de tema ganha rotação/fade suave na troca de ícone sol↔lua em vez do corte seco atual.
- **Inputs e selects**: `:focus-visible` padronizado em todo campo de formulário do app (borda + sombra sutil na cor de destaque do usuário), com `snappy`, funcionando nos dois temas.
- **Cards**: troca dos valores soltos do Framer Motion pelos presets `gentle` (entrada/saída/mudança de coluna) e `smooth`/`snappy` (`whileHover`/`whileTap`), refinando o hover para incluir sombra + leve elevação além do `scale` já existente.
- **Modais e dropdown de menção**: troca dos springs soltos do overlay/painel pelos presets compartilhados (`smooth`), garantindo que tudo abre/fecha com a mesma sensação.

**Fora de escopo:** `<select>` nativos não são estilizáveis/animáveis via CSS/JS (limitação de plataforma, não será contornada com componente customizado); o gesto de arrastar em si (sub-projeto 2b); fluxo de entrega/reabertura; cronômetro; painel da Diretoria.

## Verificação

Sem suíte de testes automatizados no projeto. Verificação: `npm run build` (checagem de tipos) + checklist manual nos dois temas, percorrendo cada categoria de elemento (botão, chip, toggle, input, card, modal, dropdown de menção) confirmando ausência de "saltos" e resposta consistente a hover/press/focus.
