## 1. Foto do Instagram nos cards de aluno

A foto será baixada via Apify (mesma integração que já busca seguidores) e guardada no nosso Storage para não expirar.

- Adicionar coluna `avatar_url` em `students` (URL pública da nossa Storage).
- Criar bucket público `student-avatars` para hospedar as imagens.
- Estender o edge function `fetch-follower-snapshot` para, em cada execução:
  1. Pegar `profilePicUrlHD` (Instagram) ou `avatarLarger`/`avatar` (TikTok, fallback).
  2. Baixar a imagem, fazer upload em `student-avatars/{student_id}.jpg` (com `upsert: true`).
  3. Atualizar `students.avatar_url` com a URL pública.
- Disparar o snapshot logo após criar um aluno novo (`StudentsContext.createStudent`) — assim a foto aparece em segundos sem esperar o cron.
- Botão manual “Atualizar foto” no menu do card (atalho que reusa a mesma função).
- `StudentCard` e `StudentsDashboard` (avatar do header) passam a renderizar `<img src={avatar_url} className="rounded-full object-cover" />`, com fallback para a inicial quando ainda não existe foto.

## 2. Cards de aluno com altura padronizada

- Transformar o card em flex column com `h-full` (e o container já é `grid`, então todos ficam iguais).
- Reservar espaço fixo para a seção “próximo post” e “última atividade” mesmo quando vazias (placeholder invisível) para garantir altura consistente.
- Pequeno polimento: avatar maior (56px), nome + handle alinhados, divisor sutil, rodapé sempre fixo no fim.

## 3. Tema dark “de verdade”

Reescrever os tokens HSL do `.dark` em `src/index.css`:

- `--background`: quase preto (`230 20% 5%`) em vez do cinza atual.
- `--card`: superfície elevada com leve frio (`230 18% 10%`) e borda mais visível (`230 14% 18%`).
- `--secondary`/`--muted`: dois níveis adicionais de elevação (`12%` e `15%`) para hierarquia clara entre fundo, card e elementos internos.
- Ajustar `--shadow-*` para sombras mais profundas em fundo escuro.
- `--primary` mantém o tom violeta, mas com melhor contraste de texto.
- Revisar componentes que usam `bg-white`/`bg-secondary/40` hardcoded e migrar para tokens (`bg-card`, `bg-muted`).
- Bordas dos cards passam a ter `border-border/80` em dark para melhor separação visual.

## 4. Brenda IA — prompt agnóstico de nicho + base ampliada

Reescrever o `systemPrompt` do edge function `ai-content-coach` para:

- Remover qualquer menção a “ensino de inglês”. A Brenda lê o calendário do aluno e infere automaticamente o nicho, público, tom e objetivo.
- Funcionar para qualquer vertical (educação, saúde, fitness, beleza, food, infoproduto, e-commerce, B2B, advocacia, imóveis, dev, etc.).
- Repertório consolidado (usado mentalmente, não citado nas respostas):
  - **Copywriting clássico:** Eugene Schwartz (níveis de consciência), David Ogilvy, Gary Halbert, Joe Sugarman.
  - **Frameworks:** AIDA, PAS, BAB, 4Ps, FAB, StoryBrand (Donald Miller), Hero’s Journey.
  - **Persuasão:** Cialdini (6+1 gatilhos), Cashvertising (Drew Whitman), Influence at Work.
  - **Ofertas/vendas:** Alex Hormozi (100M Offers, 100M Leads), Russell Brunson (DotCom Secrets, Expert Secrets), Grant Cardone, Jordan Belfort straight line.
  - **Conteúdo viral:** Brendan Kane (Hook Point), Made to Stick (Heaths), Contagious (Berger), retention curves do TikTok.
  - **Brasileiros:** **Leandro Ladeira** (gatilhos mentais aplicados, copy direta brasileira), Erico Rocha (fórmula de lançamento), Pedro Sobral (tráfego pago), Camila Porto, Camilo Coutinho (orgânico/SEO), Felipe Castanhari (storytelling), Gabriel Goffi (oratória).
  - **Marketing/tráfego:** Seth Godin (permission), Neil Patel (SEO/funis), tráfego orgânico vs pago, ICP, jornada de consciência, funil TOFU/MOFU/BOFU.
  - **Networking & autoridade:** Keith Ferrazzi, posicionamento de marca pessoal.
  - **Plataformas:** padrões nativos de Reels, TikTok, Carrosséis, Stories, YouTube Shorts, threads/X, LinkedIn.
- Regras de saída:
  - Detectar nicho a partir do calendário antes de sugerir.
  - Toda ideia/roteiro precisa ter: gancho específico (com número, callout ou contrarian), gatilho psicológico declarado, estrutura por tempo, CTA com baixa fricção.
  - Manter formatação Markdown rica que já estabelecemos (## título, ### blocos com emojis, blockquote no gancho, separadores `---`).
- Atualizar também os `prompt`s de `analyze`, `suggest`, `rewrite`, `script`, `chat` para serem genéricos (substituir “ensino de inglês” por “o nicho do aluno”).

## Detalhes técnicos

- **Migration:** `ALTER TABLE students ADD COLUMN avatar_url text;` + criação do bucket público `student-avatars` com policies de leitura pública e escrita via service role.
- **Edge function:** `fetch-follower-snapshot` ganha bloco que faz `fetch(profilePicUrlHD)` → `supabase.storage.from('student-avatars').upload(...)` → `update students set avatar_url`.
- **Frontend:**
  - `StudentsContext.createStudent` chama `supabase.functions.invoke('fetch-follower-snapshot', { body: { student_id } })` em background (fire-and-forget) após o insert.
  - `StudentCard.tsx`, `StudentsDashboard.tsx` (header), e qualquer outro lugar com inicial → renderizam `<img>` quando `avatar_url` existe.
  - Equalização de altura: `grid` já está; cards ganham `flex flex-col h-full`, footer `mt-auto`, blocos opcionais com `min-h` reservado.
- **Dark mode:** apenas `src/index.css` — sem mexer em componentes (eles usam tokens). Auditar 3-4 componentes que usam cor direta (`bg-white`, etc.) e migrar.
- **Brenda prompt:** reescrita completa em `supabase/functions/ai-content-coach/index.ts`. Deploy automático.
- Sem mudança de schema fora do `avatar_url`. Sem nova dependência npm.
