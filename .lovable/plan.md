

## Plano de Melhorias — Calendário, Modo Aluno e Uploads

Vou agrupar todas as mudanças em quatro frentes:

---

### 1. Ajustes visuais no calendário

- **Cards uniformes**: voltar todos os dias ao mesmo tamanho (grid `auto-rows-fr` com altura fixa por linha). O card colorido de conteúdo passa a ocupar a célula inteira em vez de empilhar.
- **Múltiplos posts no mesmo dia**: dividir a célula horizontalmente (mini cards lado a lado), mantendo tamanho uniforme.
- **Centralização total**: número do dia no topo centralizado, formato + ícone da rede no meio, título completo (sem truncar) abaixo, status no rodapé.
- **Mobile**: aumentar `min-h` (ex.: 90px), reduzir paddings, garantir que título caiba em 2-3 linhas com `text-[10px]`. Cards continuam clicáveis.
- **Ícone TikTok**: substituir o emoji 🎵 por um SVG real do TikTok (componente inline, mesmo tamanho do `Instagram` do lucide). Ícones do Instagram em rosa/roxo, TikTok em preto.

### 2. Limpeza da UI

- **Remover sidebar inteiro de "Conteúdos"** (a navegação lateral). Manter apenas: logo "Plano de Conteúdo", filtros de rede e categoria reposicionados como uma barra horizontal compacta no topo (abaixo do header), e bloco de usuário/logout no canto.
- **Remover card "Formato"** dos KPIs (passa de 4 para 3 cards: Total, Redes, Progresso).
- **Adicionar "Lembrete"** ao enum `Format` em `src/data/content.ts`, e às listas em `NewPostDialog.tsx` e `PostDrawer.tsx`.

### 3. Modo Admin vs Modo Aluno (compartilhamento de calendário)

**Como funciona:**

- Toda pessoa que loga é admin do **seu próprio calendário** por padrão.
- Cada admin terá um **link público compartilhável** com o ID do seu calendário, ex.: `/aluno/{userId}`.
- Quando um aluno abre esse link (sem precisar fazer login), ele vê o calendário em **modo somente-leitura**, com **uma única exceção**: pode alterar o **status** do card (A fazer / Em produção / Publicado) e fazer **upload de mídia** (ver item 4).
- O aluno **não pode**: editar título, categoria, formato, rede, data, roteiro, notas, criar ou excluir posts.

**Implementação:**

- Nova rota `/aluno/:ownerId` que renderiza o calendário no modo aluno.
- Botão "Compartilhar com aluno" no header do admin, que copia o link para a área de transferência.
- Novo prop `viewMode: "admin" | "student"` propagado via contexto, controlando o que aparece no `PostDrawer` e desabilitando o botão "Novo Conteúdo" / "+" nas células vazias.
- RLS atual já permite leitura pública em `content_posts`; vou adicionar política para permitir UPDATE somente das colunas `status` e do campo de mídia quando vier do modo aluno (validação no client + policies no banco).

### 4. Upload de fotos/vídeos pelo aluno

- Criar **Storage bucket público** `post-media` no Lovable Cloud.
- Adicionar coluna `media_urls text[]` na tabela `content_posts` (default `'{}'`).
- No `PostDrawer`, nova seção **"Mídia produzida"** disponível em ambos os modos, mas com upload habilitado também para aluno.
- Exibir miniaturas das fotos/vídeos enviados, com opção de ampliar e (no modo admin) excluir.
- Aceitar imagens (jpg, png, webp) e vídeos (mp4, mov) até ~50MB.

### 5. Esquema técnico

```text
content_posts (existente)
  + media_urls text[] default '{}'

storage bucket: post-media (público para leitura)
  policies:
    - SELECT: público
    - INSERT: público (qualquer um pode subir)
    - DELETE: somente owner do post (validado no client)
```

```text
Rotas:
  /login        → tela de login por nome
  /             → calendário em modo admin (logado)
  /aluno/:id    → calendário em modo aluno (público, somente status + upload)
```

---

### Arquivos que serão alterados/criados

- `src/data/content.ts` — adicionar `"Lembrete"` ao tipo `Format`, adicionar `media_urls` ao `ContentPost`
- `src/components/CalendarGrid.tsx` — uniformizar tamanho, centralização, ícone TikTok real, suporte a `viewMode`
- `src/components/KpiCards.tsx` — remover card "Formato"
- `src/components/AppSidebar.tsx` — **deletar** e substituir por barra horizontal compacta nova (`TopBar.tsx`)
- `src/components/PostDrawer.tsx` — modo aluno (campos read-only exceto status), seção de upload de mídia, opção "Lembrete"
- `src/components/NewPostDialog.tsx` — opção "Lembrete"
- `src/components/CalendarHeader.tsx` — botão "Compartilhar com aluno"
- `src/components/MediaUploader.tsx` — **novo** componente de upload/preview
- `src/pages/StudentView.tsx` — **nova** página pública somente-leitura
- `src/pages/Index.tsx` — usar nova TopBar, propagar `viewMode="admin"`
- `src/App.tsx` — adicionar rota `/aluno/:ownerId`
- Migration SQL — adicionar coluna `media_urls`, criar bucket `post-media` e policies de storage

