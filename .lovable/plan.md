## Ajustes na Brenda IA + sugestão de tipografia

### 1. Roteiros mais limpos (sem direção de cena)

Atualizar o prompt no edge function `ai-content-coach` para que TODOS os roteiros gerados (ações `suggest`, `rewrite`, `script` e respostas em `chat`) sigam uma nova regra rígida:

- **Proibido:** descrever expressões faciais, postura, gestos, enquadramento, figurino, cenário, ângulos de câmera, B-roll, "sugestões de corte", indicações entre parênteses do tipo "(olhando para a câmera)", "(com expressão de surpresa)", etc.
- **Permitido apenas:** marcação de tempo + fala literal + on-screen text.

Novo template padrão de roteiro:

```text
🎬 Roteiro

(0–3s) [fala literal do gancho]
(3–10s) [fala literal]
(10–25s) [fala literal]
(25–40s) [fala literal]
(40–50s) [fala literal do CTA]

💬 On-screen text
- frase curta 1
- frase curta 2
```

Remover dos templates atuais os blocos **"🎞️ Sugestões de corte"** e qualquer instrução que peça "indicações entre parênteses" ou "B-roll".

### 2. Atualização para a linguagem da geração de vídeo curto

Reforçar no system prompt da Brenda IA:

- Foco em **Reels / TikTok / Shorts de 15–45s** como padrão (carrossel só quando o briefing pedir).
- Ganchos de **0–2s** com pattern interrupt verbal (número, afirmação polarizadora, pergunta direta) — sem "Você sabia que…", "Hoje eu vou te ensinar…", "Fala galera".
- Linguagem **direta, coloquial, ritmo rápido**, frases de 6–12 palavras, zero jargão de marketing nas falas.
- Referências de formato atual: POV, storytime de 20s, "green screen reaction", listas faladas com contagem regressiva, "edutainment", duetos/respostas a comentário, before/after verbal.
- CTA de **baixa fricção**: "comenta X", "salva", "manda pra alguém que…" — nunca "link na bio" como CTA principal.
- Banir clichês: "bora?", "se inscreve no canal", "não esqueça de curtir", "deixa o like".

### 3. Sugestão de tipografia (apenas opinião, sem mudar nada agora)

**Stack atual:** Inter (corpo) + Fraunces (display/serifa).

Diagnóstico honesto:
- **Inter** é sólida, neutra, ótima legibilidade — porém é a fonte mais usada em SaaS hoje, então tira personalidade.
- **Fraunces** é uma serifa expressiva e bonita, mas pesa em telas densas (KPIs, cards de calendário) e pode parecer "editorial demais" para um app de produtividade.

Três direções possíveis (escolher uma na próxima rodada):

1. **Mais legível e moderna (recomendada):** trocar Inter por **Geist** ou **Plus Jakarta Sans** no corpo, manter Fraunces só em títulos grandes (h1/hero). Ganho real de leitura em tabelas e cards.
2. **Mais personalidade editorial:** manter Fraunces em display, trocar Inter por **Söhne** alternativa free como **General Sans** — dá um ar premium tipo Linear/Notion.
3. **Mais "creator/social media":** **Satoshi** (display) + **Inter Tight** (corpo) — visual mais jovem, alinhado ao público de social media manager.

Posso aplicar qualquer uma dessas — só me diga qual prefere.

---

### Arquivos afetados

- `supabase/functions/ai-content-coach/index.ts` — atualizar `systemPrompt` e os templates dos prompts de `suggest`, `rewrite`, `script` e `chat`.

Nenhum arquivo de UI é alterado nesta etapa (a parte de fontes é só recomendação para você decidir).