# Makplan Board

Quadro kanban da agência Makplan: colunas de fluxo, timer por cartão, checklist, comentários e visão geral da equipe. Multiusuário, com login por conta e dados em tempo real.

## Estrutura

- `client/` — Frontend em React + Vite + TypeScript
- Backend: [Supabase](https://supabase.com) (Postgres + Auth + Realtime) — projeto `makplan-board`. Não há servidor próprio; o client fala direto com o Supabase.

## Como rodar localmente

```bash
cd client
npm install
npm run dev
```

Abre em `http://localhost:5173`. As credenciais do Supabase ficam em `client/.env.local` (não versionado).

## Login

Cadastro restrito a e-mails `@makplan.com.br`. Cada pessoa cria a própria conta na tela de login — isso já cria o "membro" correspondente no quadro.

## Deploy

Deploy de produção na Vercel, projeto `makplan-board`, apontando para a pasta `client/`. As mesmas variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) são configuradas lá.
