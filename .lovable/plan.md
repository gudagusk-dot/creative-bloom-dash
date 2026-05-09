## Visão geral

Plano consolidado em **7 frentes**: (1) PDF profissional com métricas, (2) Dashboard de métricas por plataforma + seguidores IG, (3) UX do status para o aluno + cards coloridos por status, (4) **Categorias 100% exclusivas por calendário** (ADM cria sob demanda), (5) IA copywriter que aprende com cada calendário, (6) captura do `@Instagram` ao criar o calendário, (7) snapshots diários de seguidores IG.

---

## 1. Captura do @Instagram do aluno

**`NewStudentDialog`** ganha campos opcionais `Instagram (@)` e `TikTok (@)`. **`students`** ganha colunas `instagram_handle text`, `tiktok_handle text`. `StudentsContext.createStudent/updateStudent` sanitiza (remove `@`, URL, espaços) e salva. Diálogo de edição também expõe os campos.

---

## 2. Snapshots diários de seguidores (Instagram)

Nova tabela **`follower_snapshots`**:
```
id, student_id, platform ('instagram'), handle,
followers int, follows int, posts_count int,
captured_date date,           -- UNIQUE(student_id, captured_date)
captured_at timestamptz default now(),
raw jsonb
```

Edge function nova **`fetch-follower-snapshot`**:
- Recebe `student_id` ou `student_ids[]`.
- Lê `instagram_handle` da tabela `students`.
- Chama Apify `apify~instagram-profile-scraper` com `usernames: [handle]`.
- Faz upsert por `(student_id, captured_date)`.

`pg_cron` + `pg_net` agenda chamada diária (09:00 UTC) para todos os alunos com handle. Botão "Atualizar agora" também dispara manualmente.

TikTok **não** terá monitoramento de seguidores — só métricas de posts (já implementado).

---

## 3. Dashboard de métricas reorganizada (`StudentMetrics.tsx`)

Reescrita com **abas** `Visão Geral · Instagram · TikTok`.

### Visão Geral
- Cabeçalho com avatar IG + handles + seletor de mês.
- KPIs gerais consolidados.
- Mini-card "Seguidores IG hoje" + Δ diário + Δ mensal.

### Aba Instagram
- **Card de Seguidores**: número atual, ganho/perda **hoje** (vs ontem) e **no mês** (vs primeiro snapshot do mês), %, com seta verde/vermelha.
- **LineChart** (Recharts): evolução diária de seguidores no mês.
- **BarChart**: ganho líquido por dia (positivo/negativo).
- KPIs de posts IG: views, likes, comentários, engajamento médio.
- Tabela só de posts publicados no Instagram.

### Aba TikTok
- KPIs do mês: views, likes, comentários, shares, eng. médio.
- Top 5 posts TikTok.
- Tabela só de posts TikTok.

Filtragem usa `network`/`platform` já existentes em `content_posts`/`post_metrics`.

---

## 4. PDF mais profissional + métricas

`exportCalendarPDF` ganha parâmetros `metrics` e `followers`. Estrutura:

```text
Pág 1  Capa refinada (tipografia maior, badge do mês, handles do aluno)
Pág 2  Resumo executivo (KPIs já existentes + linha "performance social")
Pág 3  Análise visual (donuts/barras melhorados)
Pág 4  PERFORMANCE INSTAGRAM (NOVA)
        - bloco seguidores: atual / Δ dia / Δ mês / %
        - mini line chart (canvas → PNG) de seguidores no mês
        - KPIs de posts IG (views, likes, coments, eng.)
        - top 3 posts IG do mês
Pág 5  PERFORMANCE TIKTOK (NOVA)
        - KPIs de posts TikTok
        - top 3 posts TikTok do mês
Pág 6  Calendário visual (refinado: cabeçalho de dias com pílula, sombras suaves)
Pág 7+ Lista detalhada (autoTable: zebra, badges de categoria, métricas se publicado)
```

Refinos visuais: hierarquia tipográfica, mais respiro, paleta unificada, badges de status com pílula colorida, cabeçalhos com barra de gradiente fina.

---

## 5. UX do status do aluno + cards coloridos por status

### `PostDrawer` (visão aluno)
Trocar os 3 botões de status por **3 cards-pílula grandes lado a lado**, cada um com ícone (Circle / Loader / CheckCircle2), título e cor sólida quando ativo. **Auto-save ao clicar** (sem precisar do botão "Salvar"), com toast "Status atualizado". Animação suave via `framer-motion`.

### Cards do calendário (Mês / Semana / Lista)
Hoje a cor do card vem só da categoria. Adicionar **borda esquerda colorida + fundo sutil** baseado no **status**:
- `Publicado` → borda esquerda verde 4px + leve `bg-green-500/5` + check verde no canto.
- `Em produção` → borda esquerda âmbar + leve `bg-amber-500/5`.
- `A fazer` no passado (atrasado) → borda esquerda vermelha + `bg-red-500/5` + ícone de alerta vermelho pulsante.
- `A fazer` no futuro → atual (categoria como dot, sem ênfase extra).

A pílula da categoria continua aparecendo (cor de categoria), mas o **status passa a dominar** visualmente.

Tokens novos em `index.css`: `--status-published`, `--status-progress`, `--status-overdue`. Aplicar nos 3 views (`MonthView`, `WeekView`, `ListView`).

---

## 6. Categorias 100% exclusivas por calendário

**Problema atual:** as 6 categorias ("Educativo", "Situações Reais", "Autoridade", "Destrave seu Inglês", "Bastidores", "Interação") estão hard-coded em `src/data/content.ts` e aparecem em **todo** calendário novo, vazadas do planejamento original.

### Regra nova
- **Calendário novo (do zero) → ZERO categorias.** Nenhuma sugestão pré-carregada.
- O **ADM cria as categorias** que quiser, no momento que quiser.
- Categorias ficam **salvas no calendário** e voltam automaticamente sempre que o ADM cria um novo post nesse mesmo calendário.
- **Cada calendário tem seu próprio conjunto** — não vaza para outros alunos.
- Calendários antigos que já têm posts continuam funcionando (categoria fica como texto livre).

### Implementação
Nova tabela **`student_categories`**:
```
id, student_id, name text, color text (#hex),
order_index int, created_at, updated_at
UNIQUE(student_id, name)
```
RLS pública (mesmo padrão do projeto).

`StudentsContext.createStudent`:
- Remove o checkbox "Começar com template" do `NewStudentDialog` para a parte de **categorias** (calendário sempre começa sem categorias). O seed de **posts de exemplo** vira opcional separado, e os posts seedados não criam categorias automaticamente — se o usuário marcar seed, criamos as 6 categorias só nesse caso.
- Sem seed → tabela `student_categories` fica vazia para o aluno.

Novo `CategoriesContext` (escopado por `student_id` ativo) que carrega/cria/edita/deleta categorias do aluno em tempo real (Supabase realtime).

### Fluxo do ADM ao criar/editar post (`NewPostDialog`, `PostDrawer`)
- O seletor de categoria mostra **só as categorias daquele calendário**.
- Se vazio: mostra estado "Nenhuma categoria ainda" + botão **"+ Nova categoria"** (popover com `name` + color picker).
- Botão "+ Nova categoria" também sempre disponível ao lado das pílulas existentes.
- Ao criar, a categoria entra na lista do calendário e fica selecionada no post atual.

### Diálogo "Gerenciar categorias"
Acessível pelo `TopBar` (admin): adicionar / renomear / mudar cor / reordenar (drag) / excluir. Excluir pede confirmação se houver posts usando (ao confirmar, posts ficam com categoria vazia, não são apagados).

### Refactor de tipos
- `Category` deixa de ser união literal e vira `string`.
- Componentes que dependem de `categoryConfig` (TopBar, ProgressPanel, KpiCards, MonthView, WeekView, ListView, PostDrawer, NewPostDialog, PDF, métricas) passam a ler do `CategoriesContext` e aplicar cor via inline style.
- `categoryConfig` em `src/data/content.ts` vira fallback **somente** para os dados de seed (quando o usuário pede explicitamente seed).
- Tailwind: classes `cat-*` permanecem como fallback semântico mas não são mais a fonte da cor — cor vem do banco.

### TopBar
A barra de filtro por categoria no topo passa a renderizar **apenas as categorias do calendário ativo**. Se vazio, mostra "Sem categorias" + botão "+ Adicionar".

---

## 7. IA Copywriter por aluno (admin)

Usar **Lovable AI Gateway** (sem API key extra), modelo padrão `google/gemini-3-flash-preview` com fallback para `google/gemini-2.5-pro` em "análise profunda".

### Edge function nova `ai-content-coach`
Recebe `{ student_id, mode, count?, brief? }`, onde `mode`:
- `analyze` — analisa o calendário (padrões, categorias usadas, tom, gaps).
- `suggest` — gera N novas ideias de posts coerentes com o histórico.
- `rewrite` — recebe um título/roteiro e devolve versão melhorada.
- `script` — gera roteiro completo (hook, corpo, CTA) para um post existente.

Função:
1. Carrega aluno + categorias do aluno + últimos ~50 posts (título, formato, categoria, rede, status, roteiro resumido, métricas se houver).
2. Monta prompt-system: *"Você é um social media e copywriter profissional especialista em Instagram e TikTok para [nicho do aluno baseado nos posts]. Estude o estilo e padrões deste calendário antes de responder e use APENAS as categorias existentes deste calendário."*.
3. `streamText` com Output schema (Zod) quando estruturado:
   ```ts
   suggestions: [{ title, format, category, network, hook, why_this_works }]
   ```
4. Streaming de volta para o cliente.

### UI no admin
Botão "✨ Coach IA" no `TopBar` (modo admin), abre painel lateral com 3 abas:
- **Análise** — resumo do calendário (pontos fortes, gaps de categoria, sugestão de cadência).
- **Sugestões** — lista de N ideias prontas; cada card tem botão "Adicionar ao calendário" (cria `content_post` em data sugerida pela IA / próximo dia vazio, usando categoria existente do aluno).
- **Melhorar este post** — disponível também dentro do `PostDrawer` (admin): botão "Melhorar com IA" no campo de título/roteiro.

Streaming via `useChat`/`fetch`. Toast de erro para 429/402.

---

## Resumo das mudanças

**Banco (migrations):**
- `students`: + `instagram_handle`, `tiktok_handle`.
- nova `follower_snapshots` (RLS pública, índice por `(student_id, captured_date)`).
- nova `student_categories` (RLS pública, unique por `(student_id, name)`).
- habilitar `pg_cron` + `pg_net` + agendamento diário do `fetch-follower-snapshot`.

**Edge functions:**
- nova `fetch-follower-snapshot` (Apify Instagram profile).
- nova `ai-content-coach` (Lovable AI Gateway via AI SDK).

**Frontend:**
- `NewStudentDialog` + diálogo de edição: campos `@IG`/`@TT`; calendário novo nasce sem categorias.
- `StudentsContext`: tipos + create/update.
- novo `CategoriesContext` por aluno.
- novo diálogo "Gerenciar categorias" + popover "+ Nova categoria" inline.
- `TopBar`, `PostDrawer`, `NewPostDialog`, `ProgressPanel`, `KpiCards`: passam a usar categorias do aluno (não mais do `categoryConfig` global).
- `PostDrawer` (aluno): status com cards-pílula + auto-save + animação.
- `MonthView`/`WeekView`/`ListView`: cards coloridos por status (publicado/em produção/atrasado).
- `StudentMetrics.tsx`: reescrita com abas IG/TikTok/Visão Geral + bloco seguidores.
- `lib/pdfExport.ts`: novas páginas IG/TikTok + refino visual + leitura de métricas/seguidores + cores das categorias do aluno.
- novo painel "Coach IA" (admin) integrado ao `TopBar` e ao `PostDrawer`.

**Tokens:** `--status-published`, `--status-progress`, `--status-overdue` em `index.css`.

**Sem mudanças** em autenticação, storage, ou em outras tabelas existentes. Posts antigos preservam sua categoria como texto.