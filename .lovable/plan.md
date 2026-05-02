## Plano Final — Plano de Conteúdo (Teacher Ana)

Recomendação aplicada: **com Realtime** — quando você editar o calendário, o aluno vê a mudança ao vivo, sem recarregar.

---

### 1. Calendário — visual e responsivo

- Cards uniformes: grid `auto-rows-fr` com altura fixa por linha; todos os dias do mesmo tamanho.
- Múltiplos posts no mesmo dia: mini cards empilhados dentro da célula, mantendo o tamanho da célula.
- Centralização total: número do dia no topo, badge de formato + ícone da rede no meio, título completo (sem truncar), status no rodapé.
- Mobile: `min-h` maior, paddings reduzidos, título em 2-3 linhas legível.
- Ícone do TikTok: SVG real (preto), no mesmo padrão do Instagram (rosa). Substitui o emoji 🎵.

### 2. Limpeza da UI

- Remover sidebar lateral inteira ("Conteúdos" / Métricas).
- Substituir por **TopBar** horizontal compacta: logo "Plano de Conteúdo", filtros de rede e categoria, botão "Compartilhar com aluno", usuário + logout.
- Remover card "Formato" dos KPIs (fica Total, Redes, Progresso).
- Adicionar opção **"Lembrete"** ao tipo `Format` e às listas em `NewPostDialog` e `PostDrawer`.

### 3. Modo Admin vs Modo Aluno

- Cada usuário logado é admin do **seu próprio calendário**.
- Botão **"Compartilhar com aluno"** copia link público: `/aluno/{userId}`.
- Aluno abre o link **sem login**, vê o calendário em modo somente-leitura.
- Aluno pode apenas: alterar **status** do card e **enviar mídia** (fotos/vídeos do que produziu).
- Aluno **não pode**: criar, excluir, editar título/categoria/formato/rede/data/roteiro/notas.

### 4. Upload de mídia (fotos/vídeos)

- Bucket público `post-media` no Lovable Cloud.
- Coluna `media_urls text[]` em `content_posts`.
- No `PostDrawer`, seção **"Mídia produzida"** com miniaturas, preview ampliado e botão de excluir (admin).
- Aceita imagens (jpg, png, webp) e vídeos (mp4, mov), até ~50MB.

### 5. Realtime (sincronização ao vivo)

- Habilitar Realtime na tabela `content_posts`.
- No `ContentContext`, adicionar `supabase.channel(...).on('postgres_changes', ...)` filtrando por `user_id` do dono do calendário.
- Resultado: edição feita pelo admin aparece automaticamente na tela do aluno (e vice-versa para mudanças de status/upload).

---

### Detalhes técnicos

**Migration SQL:**
```sql
ALTER TABLE content_posts ADD COLUMN media_urls text[] NOT NULL DEFAULT '{}';
ALTER PUBLICATION supabase_realtime ADD TABLE content_posts;
ALTER TABLE content_posts REPLICA IDENTITY FULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Public upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media');
CREATE POLICY "Public delete media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media');
```

**Rotas:**
```
/login         → login por nome
/              → calendário modo admin (logado)
/aluno/:ownerId → calendário modo aluno (público)
```

**Arquivos:**
- `src/data/content.ts` — `Format` ganha `"Lembrete"`; `ContentPost` ganha `media_urls: string[]`
- `src/components/CalendarGrid.tsx` — cards uniformes, ícone TikTok SVG, prop `viewMode`, suporte a `ownerId` opcional
- `src/components/KpiCards.tsx` — remove card "Formato"
- `src/components/TopBar.tsx` — **novo**, substitui a sidebar
- `src/components/AppSidebar.tsx` — removido do layout
- `src/components/CalendarHeader.tsx` — botão "Compartilhar com aluno"
- `src/components/PostDrawer.tsx` — modo aluno (read-only exceto status), seção mídia, opção "Lembrete"
- `src/components/NewPostDialog.tsx` — opção "Lembrete"
- `src/components/MediaUploader.tsx` — **novo**, upload + preview + excluir
- `src/context/ContentContext.tsx` — aceita `ownerId` opcional, ativa subscription Realtime
- `src/pages/StudentView.tsx` — **nova** página pública
- `src/pages/Index.tsx` — usa TopBar, propaga `viewMode="admin"`
- `src/App.tsx` — adiciona rota `/aluno/:ownerId`
- Migration SQL — coluna `media_urls`, bucket `post-media`, realtime
