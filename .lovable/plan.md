## Visão geral

Expandir o uso da Apify para transformar o app numa central de inteligência de conteúdo. Entrega em 3 frentes:

1. **Inspirar-se em um post** (Novo Conteúdo) — colar link → IA reescreve adaptado ao nicho do aluno.
2. **Copiar conteúdo** (Brenda IA) — colar link → métricas reais + análise completa (copy/visual/social) + roteiro recriado.
3. **Inteligência extra via 4 novos actors**: perfil, hashtag, comentários — disponíveis na Brenda IA como novos quick actions.

Tudo reusa `APIFY_API_TOKEN` e `LOVABLE_API_KEY` já configurados.

---

## 1. Edge function única: `apify-tools`

Arquivo: `supabase/functions/apify-tools/index.ts`

Endpoint genérico que recebe `{ tool, input }` e roteia para o actor certo. Reduz boilerplate vs criar 1 function por actor.

Tools suportadas (com normalização de saída):

| tool | actor | output normalizado |
|---|---|---|
| `post` | `apify~instagram-scraper` / `clockworks~tiktok-scraper` | post completo (caption, hashtags, métricas, mídia, autor, música) |
| `profile` | `apify~instagram-profile-scraper` / `clockworks~tiktok-profile-scraper` | bio, seguidores, top posts |
| `hashtag` | `apify~instagram-hashtag-scraper` / `clockworks~tiktok-hashtag-scraper` | top posts da hashtag, volume, ângulos recorrentes |
| `comments` | `apify~instagram-comment-scraper` / `clockworks~tiktok-comments-scraper` | top comentários, sentimento bruto, dores/objeções |

Padrões:
- Detecta plataforma a partir da URL/handle.
- Validação Zod no body.
- `resultsLimit` baixo por padrão (1 post / 20 comentários / 12 top posts) para custo.
- Reusa o helper `runActor` do estilo de `fetch-post-metrics`.
- CORS padrão; verify_jwt default.

---

## 2. Edge function `ai-content-coach` — novas actions

Adicionar ao switch atual:

- **`inspire_from_post`** — entrada `{ scraped_post, posts_context }`. Saída: título magnético + roteiro pronto no template padrão da Brenda, **adaptado ao nicho do aluno** (não cópia literal). Foco em extrair o gancho/estrutura e reaplicar.
- **`copy_content`** — entrada `{ scraped_post, posts_context }`. Saída em Markdown com seções:
  - 📊 Métricas reais (likes, views, comments, shares, ER calculado)
  - 🔍 Por que esse conteúdo funcionou
  - ✍️ Análise de copy (gancho, estrutura, CTA, gatilhos)
  - 🎨 Análise visual (formato, ritmo inferido de duração/legenda/hashtags)
  - 🧲 Análise de social media (timing, hashtags, posicionamento)
  - 🎬 Roteiro recriado adaptado ao nicho
- **`analyze_profile`** — entrada `{ scraped_profile, posts_context }`. Saída: análise estratégica do perfil (concorrente/referência) + 3 ideias acionáveis para o aluno.
- **`analyze_hashtag`** — entrada `{ scraped_hashtag, posts_context }`. Saída: ângulos vencedores na hashtag, padrões de gancho, 3 ideias adaptadas ao nicho.
- **`analyze_comments`** — entrada `{ scraped_comments, posts_context }`. Saída: dores/objeções/linguagem do público + 3 ganchos prontos derivados dos comentários.

System prompt da Brenda permanece; cada action tem template Markdown próprio seguindo as regras já existentes (roteiro = só tempo + fala literal).

---

## 3. UI — Novo Conteúdo (`src/components/NewPostDialog.tsx`)

Tabs no topo do diálogo:
- **Do zero** (atual)
- **Inspirar em um post** (nova)

Aba nova:
- Input de URL (TikTok/IG) + botão "Buscar e gerar".
- Loading: "Analisando post…" → "Brenda escrevendo…".
- Sucesso: preview compacto (thumbnail, autor, métricas) + título e roteiro são preenchidos automaticamente nos campos do form, que volta ao modo edição normal para o usuário ajustar e salvar.
- Erros via `sonner`.

---

## 4. UI — Brenda IA (`src/components/CoachDialog.tsx`)

Adicionar novos `QUICK_ACTIONS` ao menu (mantendo os 3 atuais):

- **Copiar conteúdo** — input: URL de post.
- **Espionar perfil** — input: URL/handle de perfil.
- **Radar de hashtag** — input: hashtag (ex.: `#inglesonline`).
- **Decifrar comentários** — input: URL de post (puxa comentários).

Para cada um:
1. Novo `Step` com input dedicado (URL ou handle/hashtag).
2. Chama `apify-tools` → loading "Analisando…" → chama `ai-content-coach` com a action correspondente.
3. Renderiza no chat com `ReactMarkdown` (já existente).
4. Quando aplicável, mostra cabeçalho com thumbnail/avatar e métricas reais antes do markdown da IA.

Reorganização visual: agrupar quick actions em 2 seções no menu — **"Sobre o calendário"** (analisar/sugerir/melhorar) e **"Inteligência externa"** (copiar/espionar/radar/decifrar).

---

## 5. Detalhes técnicos

- Sem mudanças no schema do banco (resultados são one-shot, não persistidos).
- Custos Apify controlados via `resultsLimit` baixo e timeout de 180s.
- Erros do Apify (post privado, perfil inexistente, hashtag vazia) tratados com mensagens claras.
- `supabase/config.toml`: nada a mudar.
- Sem novas dependências npm.

---

## Ordem de implementação sugerida

1. `apify-tools` edge function com as 4 tools normalizadas.
2. Novas 5 actions em `ai-content-coach`.
3. UI Novo Conteúdo — aba "Inspirar em um post".
4. UI Brenda IA — 4 novos quick actions + reorganização do menu.
5. QA manual com 1 link real de cada plataforma para cada tool.