
## Visão geral

Três frentes independentes, entregues em ondas. Tudo aditivo — nada do banco ou código atual será perdido.

---

## Onda 1 — PDF profissional

Substituir o `pdfExport.ts` atual (jsPDF cru) por um relatório multi-página com identidade visual.

**Estrutura do PDF (A4 retrato, 4–6 páginas):**

1. **Capa** — gradient roxo/rosa da tela de login, logo/título "Plano de Conteúdo", nome do aluno, mês/ano, data de geração.
2. **Resumo executivo** — 4 KPIs grandes em cards: Total de posts, Publicados, Pendentes, % de execução. Frase curta de status.
3. **Gráficos** —
   - Donut: Executado vs Pendente vs Atrasado
   - Barras horizontais: posts por categoria (cores oficiais das categorias)
   - Barras: posts por rede (Instagram / TikTok / Reels)
4. **Calendário mensal** — grid visual com cores de status por dia.
5. **Lista de posts do mês** (tabela): data, título, categoria, rede, status, link.

**Stack técnica:**
- `jspdf` + `jspdf-autotable` (já temos jspdf) para tabelas.
- `chart.js` + `chartjs-node-canvas` não roda no browser; vamos usar **chart.js no cliente** renderizando em `<canvas>` off-screen e convertendo para imagem com `toDataURL()` antes de inserir no PDF.
- Cores via tokens HSL já existentes em `index.css`.
- Novo arquivo `src/lib/pdf/` com módulos: `cover.ts`, `kpis.ts`, `charts.ts`, `calendar.ts`, `postsTable.ts`, `index.ts`.

---

## Onda 2 — Dashboard de métricas por aluno

**Mudança no card (`StudentCard.tsx`):**
- Remover o clique no card inteiro.
- Adicionar 2 botões claros no rodapé: **Calendário** (ícone calendar) e **Métricas** (ícone bar-chart).

**Nova rota `/aluno/{slug}/metricas` (`StudentMetrics.tsx`):**
- Header com nome do aluno + seletor de mês.
- KPIs: total publicado, total de likes, views, comentários, engajamento médio.
- Gráficos (recharts, já presumo instalado — confirmar):
  - Linha: evolução de posts publicados por semana
  - Barras: top 5 posts por views
  - Pizza: distribuição por categoria
  - Barras agrupadas: performance por rede social
- Tabela: todos os posts publicados com link, métricas e botão "Atualizar métricas".
- Botão "Atualizar todas" no topo que dispara scraping em lote.

---

## Onda 3 — Scraping de métricas (Apify freemium)

**Decisão:** Apify oferece $5 de créditos grátis/mês + actors prontos para Instagram e TikTok que retornam likes/views/comentários por URL de post. Único provider que cobre as duas redes com tier free real.

**Fluxo:**
1. Criar tabela `post_metrics` (post_id FK, likes, views, comments, shares, fetched_at, raw_json).
2. Pedir ao usuário a `APIFY_API_TOKEN` via `add_secret` (ele cria conta grátis em apify.com → Settings → Integrations).
3. Edge function `fetch-post-metrics`:
   - Recebe `post_id`.
   - Lê `published_link` do post.
   - Detecta plataforma pela URL (instagram.com / tiktok.com).
   - Chama actor Apify correspondente (`apify/instagram-post-scraper` ou `clockworks/tiktok-scraper`) via REST sync endpoint.
   - Faz upsert em `post_metrics`.
4. Edge function `fetch-student-metrics` para batch (todos os posts publicados do aluno no mês).
5. Frontend chama via `supabase.functions.invoke()` com loading + toast.
6. KPIs e gráficos da Onda 2 leem de `post_metrics`.

**Limites/expectativas que vou comunicar:**
- ~100–300 posts/mês cabem no tier grátis dependendo do actor.
- Stories/Reels privados não são suportados.
- Rate limit: 1 post por vez no batch para não estourar quota.

---

## Mudanças no banco

Migration única com:

- **`post_metrics`** — post_id (FK content_posts), likes, views, comments, shares, engagement_rate, raw (jsonb), fetched_at, created_at, updated_at. RLS: dono do post (via owner_id do post pai) lê/escreve.

Nada existente é alterado.

---

## Novos secrets

- `APIFY_API_TOKEN` (será solicitado via `add_secret` no início da Onda 3).

---

## Ordem de execução

1. Onda 1 (PDF) — sem dependências.
2. Onda 2 estrutura (rota + 2 botões + página vazia com gráficos mockados a partir do `content_posts`).
3. Migration `post_metrics`.
4. Pedido do `APIFY_API_TOKEN`.
5. Onda 3 (edge functions + integração na página de métricas).

Cada onda é testável e reversível independente.
