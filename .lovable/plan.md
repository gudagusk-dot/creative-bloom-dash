## Visão geral

Reformulação focada em 5 frentes: (1) modelo "calendários por aluno" com cadastro (nome + WhatsApp), (2) links de compartilhamento bonitos com slug, (3) progresso reorganizado por aluno em cards, (4) drawer simplificado para o aluno em 2 abas, (5) dark mode + correções de UI no calendário.

---

## 1. Cadastro de alunos e múltiplos calendários

Hoje cada admin tem **um único calendário** com todos os posts em `content_posts.user_id`. Vamos introduzir o conceito de **aluno/calendário** como entidade separada.

**Banco — nova tabela `students`:**
```text
students
  id            uuid pk
  owner_id     uuid  -> simple_users.id (admin dono)
  name          text
  slug          text  (unique, gerado do nome: "maria-silva")
  whatsapp      text  (opcional, formato +5511999999999)
  created_at    timestamp
```
- Migrar `content_posts.user_id` para representar **o aluno**, não o admin. Adicionar coluna `student_id uuid` em `content_posts` e `post_activity`. Para os dados existentes do usuário atual, criamos um aluno "default" e fazemos backfill.
- RLS pública (mantém padrão atual do projeto).

**UI — tela inicial do admin (`/`):**
- Vira um **dashboard de alunos**: lista em cards (nome, WhatsApp, % progresso, mídias enviadas, último acesso).
- Botão **"Novo calendário"** abre dialog com: Nome do aluno, WhatsApp (opcional), opção "começar do zero" ou "duplicar do template".
- Clicar em um card abre `/calendario/:slug` (a tela atual de calendário, mas escopada àquele aluno).

**Compartilhamento:**
- Link público vira `/aluno/:slug` (ex.: `/aluno/maria-silva`) em vez do UUID.
- No `ShareDialog`, permitir **editar o slug** na hora (input com preview do link). Se o aluno foi criado sem WhatsApp, mostrar um campo para preencher; o botão WhatsApp usa `https://wa.me/{numero}?text=...` se preenchido, senão cai no `wa.me/?text=...` genérico.

---

## 2. Acesso do aluno (sem login)

- Rota `/aluno/:slug` continua **pública, sem login**. O `slug` identifica qual calendário carregar.
- O `student_id` resolvido pelo slug é gravado em `localStorage` como `current_student_id` apenas para atribuir as ações (uploads, mudanças de status) ao aluno correto no log.
- O aluno **nunca** precisa digitar nome ou logar; o link já carrega tudo dele e salva no banco — outro dispositivo com o mesmo link vê o mesmo estado.

---

## 3. Drawer simplificado para o aluno (2 abas)

Hoje o aluno vê 3 abas (Detalhes / Roteiro / Mídia) com muitos campos travados. Vamos simplificar:

**Aba 1 — "Conteúdo" (read-only resumido):**
- Título, data, formato, rede social, categoria (badges, sem selects).
- Roteiro renderizado abaixo (se houver).
- Status como botões clicáveis (única coisa editável aqui).

**Aba 2 — "Entrega":**
- Upload de mídias (já existe).
- Campo **"Link do post publicado"** (novo: coluna `published_url text` em `content_posts`).
- Campo **"Comentário do aluno"** (novo: coluna `student_notes text`, separado de `notes` que é do admin).
- Ao salvar link/comentário, registra atividade `link_added` / `note_added`.

Admin continua vendo todas as 3 abas atuais + ganha visualização do `published_url` e `student_notes`.

---

## 4. Painel de progresso reorganizado

Substituir a lista linear atual por uma estrutura em **cards e seções colapsáveis**, escopada ao aluno aberto (e na home agregada por aluno).

**Layout:**
```text
┌─ KPIs em cards grandes ────────────┐
│ [Total] [A fazer] [Em produção]    │
│ [Publicado] [Mídias] [Links]       │
└────────────────────────────────────┘

[Tabs: Pendências | Em produção | Publicados | Mídias | Atividade]

Pendências: cards de post (título, data, status badge, "ver")
            destaca atrasados em vermelho
Em produção: idem
Publicados:  idem + link do post (clicável)
Mídias:      grid de thumbs com filtro por post
Atividade:   timeline (formato atual mas com ícones por tipo)
```
- Cada card tem botão "Abrir" que abre o `PostDrawer` por cima.
- Realtime mantido.

---

## 5. Correção de UI no calendário

**Bug do número do dia saindo do card** (`CalendarGrid.tsx`):
- Em dias com posts, o `<span>` está com `absolute -top-1 left-1` (fora do container) e o pai não tem `padding`/`overflow-hidden`. Trocar para `top-0.5 left-1` dentro de um container com `relative overflow-hidden rounded-lg`, ou simplesmente colocar o número como elemento normal acima dos cards (não absoluto).
- Aplicar a mesma estrutura para dias com e sem post (consistência visual).

**Mobile mais bonito:**
- Reduzir altura mínima de `min-h-[110px]` para `min-h-[72px]` em <sm.
- Em telas <sm, mostrar **apenas a tag colorida (formato) + ícone da rede** (sem texto do título), pois o título fica espremido. Toque abre o drawer.
- Aumentar o `gap` entre células de `gap-1` para `gap-1.5`.
- Cantos mais arredondados (`rounded-xl`) e sombra leve nos cards de post.

---

## 6. Dark mode (toggle)

- Adicionar tokens `.dark` em `src/index.css` (background escuro, card mais escuro, mantendo as cores das categorias).
- Criar `ThemeContext` que persiste em `localStorage` (`theme: "light" | "dark"`) e aplica `class="dark"` no `<html>`.
- Botão de switch (sol/lua) no `TopBar`, visível tanto para admin quanto para aluno.

---

## Detalhes técnicos

**Arquivos a criar:**
- `src/context/ThemeContext.tsx`
- `src/pages/StudentsDashboard.tsx` (nova home do admin)
- `src/pages/CalendarPage.tsx` (calendário escopado a um aluno; substitui `Index.tsx` no roteamento de calendário)
- `src/components/NewStudentDialog.tsx`
- `src/components/StudentCard.tsx`
- `src/components/ThemeToggle.tsx`
- Migração SQL: tabela `students` + colunas `student_id`, `published_url`, `student_notes`, backfill.

**Arquivos a modificar:**
- `src/App.tsx`: rotas `/` (dashboard de alunos), `/calendario/:slug` (admin), `/aluno/:slug` (aluno). Envolver com `ThemeProvider`.
- `src/context/ContentContext.tsx`: aceitar `studentId` em vez de `ownerId`; `addPost`/`updatePost` usam `student_id`.
- `src/components/ShareDialog.tsx`: receber `student` (com slug + whatsapp), permitir editar slug, link com slug, WhatsApp direto se número preenchido.
- `src/components/ProgressPanel.tsx`: refazer com tabs e cards.
- `src/components/PostDrawer.tsx`: ramo `viewMode === "student"` com 2 abas novas; admin ganha campos `published_url` e `student_notes` em modo leitura.
- `src/components/CalendarGrid.tsx`: corrigir número do dia + layout mobile.
- `src/components/TopBar.tsx`: adicionar `ThemeToggle`; em modo admin mostrar nome do aluno do calendário aberto + botão "voltar para alunos".
- `src/index.css`: tokens `.dark`.

**Pergunta sobre dados existentes:** o calendário atual já preenchido será migrado para um aluno "default" automaticamente, e você poderá renomeá-lo em seguida. Confirma?
