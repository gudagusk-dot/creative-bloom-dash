

## Plano de Melhorias — Plano de Conteúdo (Teacher Ana)

### Resumo das mudanças

1. **Renomear títulos** — "Content Planner" → "Plano de Conteúdo"; aba do navegador → "Conteúdos - Teacher Ana"
2. **Remover link "Métricas"** da sidebar
3. **Redesign dos cards do calendário** — fundir o card de data e o card de conteúdo num card único colorido pela categoria, com título completo centralizado (sem truncar)
4. **Edição com botão Salvar** — ao clicar num card, abrir o drawer de edição com todos os campos (incluindo roteiro rico) e um botão "Salvar" explícito (em vez de salvar automaticamente a cada keystroke). O roteiro salvo aparece renderizado em HTML; ao clicar "Editar roteiro", volta para o editor
5. **Login simples por nome** — tela de login onde o usuário digita apenas o nome; persistência via Lovable Cloud (Supabase) com tabela `users` (id, name) e tabela `posts` vinculada ao user_id para salvar progresso entre dispositivos

---

### Detalhes técnicos

**Arquivos modificados:**
- `index.html` — title para "Conteúdos - Teacher Ana"
- `src/components/AppSidebar.tsx` — remover "Métricas" do nav, trocar título para "Plano de Conteúdo"
- `src/components/CalendarGrid.tsx` — redesign: cada célula-dia com posts vira um card único com fundo na cor da categoria, número do dia no canto, título completo centralizado sem `line-clamp`, formato e rede social como badges pequenos
- `src/components/PostDrawer.tsx` — adicionar botão "Salvar" no rodapé (acumula edições no state local e salva tudo de uma vez); roteiro com modo visualização (HTML renderizado) e modo edição (RichTextEditor); remover auto-save nos onChange
- `src/components/CalendarHeader.tsx` — atualizar título exibido
- `src/context/ContentContext.tsx` — sem grandes mudanças por enquanto (login adicionará persistência depois)

**Login e persistência (Lovable Cloud):**
- Criar tabela `users` (id uuid PK, name text unique)
- Criar tabela `content_posts` (mesmos campos do ContentPost + user_id FK)
- Tela `/login` simples: input de nome → upsert no `users` → salvar user_id no contexto
- Ao carregar, buscar posts do banco; ao salvar/criar/excluir, persistir no banco
- RLS: cada user só vê/edita seus posts
- Rota protegida: se não logado, redireciona para `/login`

**Novo fluxo do drawer:**
- Campos editáveis com estado local
- Aba "Roteiro" mostra HTML renderizado (via `dangerouslySetInnerHTML` com DOMPurify sanitization)
- Botão "Editar roteiro" alterna para o RichTextEditor
- Botão "Salvar" no final persiste todas as mudanças de uma vez

