## Problemas e melhorias a entregar

### 1. Bug do botão de status que "fica branco"
Em `PostDrawer.tsx` (view do aluno, ~linhas 224–249) os botões de status têm um `motion.div` com `absolute inset-0`, mas o `<button>` pai não é `position: relative`. O overlay se ancora no container do drawer e cobre toda a tela quando o status é trocado. Mesmo padrão (com efeito menor) na visão admin.

### 2. Status só para o aluno
Hoje a seção de Status aparece também na aba do admin. O admin não deve editar o status — apenas o aluno marca "A fazer / Em produção / Publicado".

### 3. IA Coach dentro de cada calendário (novo)
O Coach IA hoje só existe na página de Métricas do aluno. O admin precisa de um Coach contextual **dentro do calendário daquele aluno** para:
- Analisar roteiros já criados naquele calendário (entender padrões, tom de voz, temas).
- Sugerir novos conteúdos baseados no histórico do aluno.
- Reescrever / melhorar roteiros.
- Atalho rápido **dentro do diálogo "Novo Conteúdo"** para gerar título/roteiro automaticamente a partir de um prompt curto, já preenchendo o formulário.

### 4. fetch-follower-snapshot não coleta
A function lê `Deno.env.get('SERVICE_ROLE_KEY')` mas o secret correto é `SUPABASE_SERVICE_ROLE_KEY` — sem service role o upsert cai em RLS e falha silenciosamente. Além disso `platform` é gravado como `"Instagram"` / `"TikTok"` enquanto o front filtra por minúsculas.

### 5. Gráfico diário de seguidores
Falta um gráfico de evolução diária por plataforma em `StudentMetrics`.

### 6. PDF sem comentários nem engajamento
O PDF atual cobre calendário/status/categorias mas não desempenho. Faltam: likes, views, comentários, shares, taxa de engajamento e top posts.

---

## Plano de implementação

### A. Fix do overlay branco no PostDrawer
- Adicionar `relative overflow-hidden` ao `<button>` de cada pill de status.
- Substituir o `motion.div absolute inset-0` por `ring-2 ring-white/30` direto na classe ativa (mantém o efeito visual sem o bug).

### B. Remover Status da aba do admin
- Remover o bloco "Status" do formulário admin do PostDrawer.
- Manter um badge somente-leitura no topo mostrando o status atual.

### C. Coach IA dentro do calendário (admin)
- Novo componente `CoachDialog.tsx`:
  - Modal com chat simples (textarea + histórico) renderizando markdown.
  - Recebe `posts` do contexto (`useContent`) e monta um resumo automático (categoria, título, roteiro, status) como contexto enviado ao backend.
  - 4 ações rápidas: **Analisar calendário**, **Sugerir 3 ideias**, **Melhorar último roteiro**, **Pergunta livre**.
- Botão **"Coach IA"** no `CalendarHeader` (admin), ícone Sparkles, abre o `CoachDialog`.
- Em `NewPostDialog.tsx`, adicionar botão **"Gerar com IA ✨"** ao lado do título:
  - Abre popover com input curto ("Sobre o que é esse post?").
  - Chama `ai-content-coach` action `script` passando histórico do calendário + prompt.
  - Resposta preenche automaticamente Título e Roteiro do formulário (admin pode editar).

### D. Endurecer ai-content-coach
- Já está com URL correta. Adicionar:
  - Tratamento de 401/402/429 retornando JSON com `error` legível.
  - Aceitar `posts_context` (array resumido) além de `content` para reduzir tokens.
  - Trocar modelo padrão para `google/gemini-2.5-flash` (resposta mais rápida; admin pode pedir Pro via flag).
- Toasts no front quando vier `error` (créditos esgotados / rate limit).

### E. Corrigir fetch-follower-snapshot
- Trocar `SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`.
- Padronizar `platform` em minúsculas (`'instagram'`, `'tiktok'`).
- Aceitar body opcional `{ student_id }` para refresh sob demanda de um único aluno.
- Manter upsert por `(student_id, platform, captured_date)` — uma chamada/dia substitui o registro do dia, criando histórico diário.

### F. Gráfico diário de seguidores
- Em `StudentMetrics.tsx`, dentro das abas Instagram e TikTok, adicionar `LineChart` (Recharts) com X = `captured_date` e linha = `followers`. Mostrar Δ vs dia anterior em destaque.

### G. PDF — página de Desempenho
- Em `pdfExport.ts` aceitar `metricsByPostId` e `snapshots` como argumentos.
- Nova página **"DESEMPENHO"** com:
  - 4 KPIs grandes: Likes, Views, Comentários, Shares (somatórios do mês).
  - KPI destacado: Taxa de engajamento média.
  - Tabela top 5 posts por engajamento (Data, Título, Likes, Views, Comentários, Engajamento).
  - Mini gráfico de evolução de seguidores no período.
- Atualizar a chamada em `StudentMetrics` para passar essas props.

---

## Arquivos afetados
- `src/components/PostDrawer.tsx` — fix do overlay e remoção do status no admin.
- `src/components/CoachDialog.tsx` (novo) — chat do Coach IA contextual.
- `src/components/CalendarHeader.tsx` — botão "Coach IA".
- `src/components/NewPostDialog.tsx` — botão "Gerar com IA" preenchendo título/roteiro.
- `supabase/functions/ai-content-coach/index.ts` — tratamento de erros + posts_context.
- `supabase/functions/fetch-follower-snapshot/index.ts` — env var, platform, body opcional.
- `src/pages/StudentMetrics.tsx` — gráfico diário + props extras pro PDF.
- `src/lib/pdfExport.ts` — nova página de desempenho.

## Validação
- Testar `fetch-follower-snapshot` via invoke e checar `follower_snapshots` no banco.
- Testar `ai-content-coach` com cada ação e validar tratamento de erro.
- Confirmar visualmente o fix do botão de status (sem overlay branco) no admin e no aluno.
- QA visual do PDF gerado (renderizar páginas como imagem antes de entregar).
