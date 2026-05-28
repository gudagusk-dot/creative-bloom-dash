## Objetivo
Transformar o avatar do usuário no header em um botão clicável que abre um menu de perfil, contendo a opção "Sair" com diálogo de confirmação antes de deslogar.

## Mudanças

**Arquivo:** `src/pages/StudentsDashboard.tsx`

1. Remover o botão `LogOut` separado (linhas 54-60) que fica ao lado do avatar.
2. Envolver o avatar (o círculo com a inicial + nome) num `DropdownMenu` do shadcn:
   - Trigger: o próprio avatar (com cursor-pointer e hover sutil).
   - Conteúdo do menu:
     - Cabeçalho com nome do usuário e e-mail (se houver `notificationEmail`).
     - Separador.
     - Item "Sair" com ícone `LogOut` (em vermelho/destructive).
3. Adicionar um `AlertDialog` de confirmação ao clicar em "Sair":
   - Título: "Deseja sair da sua conta?"
   - Descrição: "Você precisará fazer login novamente para acessar seus calendários."
   - Botões: "Cancelar" e "Sair" (destructive). Só executa `logout()` ao confirmar.
4. Controlar abertura do dialog com um `useState` local (`confirmLogoutOpen`).

## Detalhes técnicos
- Usar `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator` de `@/components/ui/dropdown-menu`.
- Usar `AlertDialog` e subcomponentes de `@/components/ui/alert-dialog`.
- Manter o estilo visual atual do avatar (gradient, ring, sombra) e adicionar `hover:opacity-90` para indicar interatividade.
- Nenhuma mudança no `UserContext` nem na lógica de `logout()`.
- Sem alterações em outras telas (apenas o header do StudentsDashboard).