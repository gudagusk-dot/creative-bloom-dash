## Resposta sobre o link do aluno

O link funciona como uma "chave" que aponta para o calendário daquele aluno no banco de dados:

- O aluno **não precisa logar** — basta abrir o link (`/aluno/maria-silva`).
- Tudo que ele faz (status, mídias, comentário, link do post publicado) é salvo automaticamente no banco.
- Abrindo o **mesmo link em qualquer dispositivo** (celular, PC, tablet), o estado é o mesmo, sempre atualizado.
- Você vê tudo em tempo real no painel de progresso do admin.
- O link só deixa de funcionar se você apagar o aluno ou renomear o slug dele.

---

## Remover "Teacher Ana" do projeto

Encontrei 3 referências:

### 1. `src/pages/Login.tsx` (linha 33)
- Hoje: `<p>Teacher Ana</p>` abaixo do título "Plano de Conteúdo".
- Mudança: remover essa linha por completo, deixando apenas o título "Plano de Conteúdo".

### 2. `index.html` (linha 7)
- Hoje: `<title>Conteúdos - Teacher Ana</title>`
- Mudança: trocar para `<title>Plano de Conteúdo</title>`.

### 3. `index.html` (linha 8)
- Hoje: `<meta name="description" content="Plano de Conteúdo - Teacher Ana" />`
- Mudança: trocar para `<meta name="description" content="Plataforma de planejamento de conteúdo para criadores e professores" />`.

Nenhuma outra parte do código menciona "Ana" ou "Teacher". O resto da plataforma já está neutro e pronto para múltiplos clientes.
