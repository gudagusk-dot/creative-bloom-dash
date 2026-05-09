import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, content, context } = await req.json()
    
    // Check for LOVABLE_API_KEY if using AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    let prompt = ""
    if (action === 'analyze') {
      prompt = `Aja como um Social Media Estrategista. Analise os seguintes conteúdos de um calendário e identifique padrões, temas recorrentes e o tom de voz: \n\n${content}`
    } else if (action === 'suggest') {
      prompt = `Com base nestes conteúdos anteriores: \n${content}\n Sugira 3 novas ideias de posts criativas e estratégicas.`
    } else if (action === 'rewrite') {
      prompt = `Melhore o seguinte roteiro de post, tornando-o mais persuasivo e engajador, mantendo o objetivo central: \n\n${content}`
    } else if (action === 'script') {
      prompt = `Crie um roteiro completo de Reels para este tema: \n\n${content}`
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'Você é um Social Media e Copywriter profissional especialista em engajamento no Instagram e TikTok.' },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
    })

    const data = await response.json()
    const text = data.choices[0].message.content

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
