## Diagnóstico

**1. Netlify desatualizado (não é bug do código)**
O preview do Lovable serve sempre o último commit. O Netlify só atualiza quando recebe um novo deploy do GitHub. Como as últimas correções (status do post, aba Entrega, etc.) já estão no Lovable funcionando, o que falta é o Netlify puxar o build novo.

Soluções possíveis:
- **Opção A (recomendada):** publicar pelo próprio Lovable (botão Publish). O domínio `.lovable.app` é atualizado em segundos.
- **Opção B:** garantir que o Netlify está conectado ao GitHub e disparar um "Trigger deploy → Clear cache and deploy site" no painel da Netlify.
- **Opção C:** verificar se há um branch travado (Netlify pode estar fixado em `main` enquanto o Lovable comita em outro branch).

Não há nada a "corrigir" no código para isso — os botões já estão certos no repositório.

**2. Métricas de seguidores não estão funcionando — causa real**
Encontrei dois problemas distintos:

a) **Nenhum aluno tem `instagram_handle` ou `tiktok_handle` preenchido** (exceto um de teste com handles inválidos). Sem handle, a Apify não tem o que buscar. O aluno "gugu" (rota atual `/metricas/gugu`) está com os dois campos vazios.

b) **Não existe coleta automática diária.** A função `fetch-follower-snapshot` só roda quando alguém clica no botão "Atualizar seguidores". Sem execução agendada, não há histórico diário/mensal para gerar gráficos de evolução.

**3. Separação Instagram x TikTok nas métricas de POSTS**
Hoje a aba "Métricas do ADM" só separa o card de seguidores por plataforma. Os cards de desempenho dos posts publicados (likes, views, comentários, shares) e o "Top 5 Posts" ainda misturam Instagram + TikTok. Precisa do mesmo filtro de plataforma aplicado a essa seção.

---

## O que vou implementar

### A. Cadastro obrigatório de handles
- No diálogo "Novo aluno" e na edição do aluno, deixar bem claro que `@instagram` e `@tiktok` são obrigatórios para coletar métricas.
- Mostrar um aviso amarelo no topo da página de Métricas quando o aluno estiver sem handle, com botão "Editar aluno" para preencher.

### B. Coleta automática diária de seguidores
- Habilitar as extensões `pg_cron` e `pg_net` no Lovable Cloud.
- Criar um job agendado que chama `fetch-follower-snapshot` todo dia às 03:00 UTC (00:00 horário de Brasília).
- Resultado: a tabela `follower_snapshots` vai acumular um registro por dia/aluno/plataforma, alimentando os gráficos de evolução diária e mensal.

### C. Botão "Atualizar agora" mais robusto
- Mostrar contagem detalhada (ex: "Instagram: 1.240 → 1.252 (+12)").
- Tratar o caso `no_data` com mensagem amigável ("Verifique o handle do TikTok").

### D. Separar métricas dos POSTS por plataforma
- O filtro de plataforma (`all | instagram | tiktok`) que hoje só afeta os cards de seguidores passa a filtrar também:
  - KPIs de desempenho (Views, Likes, Comments, Shares, Engajamento)
  - Tabela "Top 5 Posts"
  - Gráficos de evolução de engajamento
- Trocar o seletor para um `Tabs` com 3 abas: **Tudo / Instagram / TikTok** (mais visível que o toggle atual).

### E. Bônus de UX
- Quando não há snapshots ainda, mostrar mensagem "Coleta iniciada — os primeiros dados aparecem em até 24h" em vez de gráfico vazio.

---

## Detalhes técnicos

**Arquivos afetados:**
- `src/pages/StudentMetrics.tsx` — refator do filtro de plataforma para abranger toda a página + estado vazio + aviso de handle
- `src/components/NewStudentDialog.tsx` — destacar handles obrigatórios
- Migração SQL — `pg_cron` + `pg_net` + job `cron.schedule('daily-follower-snapshot', '0 3 * * *', ...)` chamando a edge function via `net.http_post` com a service role key

**Sobre a API:** a Apify que já está conectada cobre tanto seguidores quanto posts (Instagram + TikTok). Não precisa contratar nada novo. O que faltava era preencher os handles e agendar a execução.
