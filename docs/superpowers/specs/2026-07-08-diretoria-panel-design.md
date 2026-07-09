# Painel da Diretoria — Design

Sub-projeto 4 (último) de 5. Ordem geral: tema (feito) → micro-interações (feito) → drag-and-drop premium (feito) → fluxo de entrega (feito) → **painel da Diretoria (este spec)**.

## Contexto

Visão de gestão focada em tempo trabalhado e produção por pessoa, agrupada por perfil (Criação, Redação, etc.). Restrita a membros do time Diretoria.

## Decisões

- **Acesso:** nova aba "Diretoria" no `Header`, condicional a `me?.team === "diretoria"` — quem não é do time nem vê a opção. `App.tsx`'s `view` state (hoje `"board" | "overview"`) ganha `"diretoria"`.
- **Dados:** nenhuma tabela nova no Supabase. Reaproveita `Card.members` (array de ids atribuídos), `Card.col`, e `liveElapsedMs(card, now)` (já existe em `utils/time.ts`, usado pelo Dashboard).
  - Tempo por pessoa = soma de `liveElapsedMs` de todo card onde `member.id` está em `card.members`.
  - Entregas por pessoa = contagem de cards com `col === "entregue"` onde `member.id` está em `card.members`.
  - Agrupamento por perfil = `member.team`, reaproveitando `TEAMS` (já existe em `constants.ts`).
- **Limite aceito:** se um card tem mais de uma pessoa atribuída, o tempo do card é contado inteiro pra cada uma (cronômetro é por card, não por pessoa — sem divisão).
- **UI:** novo componente `DiretoriaPanel.tsx`, mesma linguagem visual do `Dashboard.tsx` existente (`.stat-card`, `.dash-section`, `.team-bar-row/.team-bar-track/.team-bar-fill`) — herda suporte a light/dark de graça por reusar as mesmas classes/CSS vars.
  - Linha de estatísticas gerais: tempo total (todos os perfis), total de cards entregues, total de pessoas ativas.
  - Um bloco por perfil (`TEAMS`, na ordem já definida): lista de pessoas daquele perfil, cada uma com uma barra de tempo trabalhado + contagem de entregas, ordenadas por tempo decrescente. Perfis sem nenhuma pessoa ainda não aparecem (evita blocos vazios).

## Escopo

**Toca:** `client/src/components/Header.tsx` (nova aba condicional), `client/src/App.tsx` (`view` state + roteamento), novo `client/src/components/DiretoriaPanel.tsx`, `client/src/App.css` (estilos reaproveitando/estendendo o padrão do Dashboard).

**Não toca:** schema do Supabase, lógica de drag-and-drop, fluxo de entrega, tema, micro-interações, cronômetro.

## Verificação

Sem suíte de testes automatizados. `npm run build` + checklist manual: logar como membro não-diretoria e confirmar que a aba não aparece; logar como diretoria e conferir os números batendo com os cards reais; testar em ambos os temas.
