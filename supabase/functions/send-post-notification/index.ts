import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { record } = await req.json();

    if (!record || !record.recipient_email) {
      return new Response(JSON.stringify({ error: "No record found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get post details for the email
    const { data: post } = await supabaseClient
      .from("content_posts")
      .select("title, category, date")
      .eq("id", record.post_id)
      .single();

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set. Notification queued but not sent.");
      return new Response(JSON.stringify({ message: "Secret RESEND_API_KEY not found. Please add it to send emails." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Plano de Conteúdo <onboarding@resend.dev>",
        to: [record.recipient_email],
        subject: `Novo conteúdo de ${record.student_name || 'seu aluno'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Novidades no Calendário!</h2>
            <p>Seu aluno <strong>${record.student_name || 'Um aluno'}</strong> acabou de atualizar um conteúdo.</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Post:</strong> ${post.title}</p>
              <p style="margin: 5px 0;"><strong>Categoria:</strong> ${post.category}</p>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${post.date}</p>
            </div>
            <p>Acesse seu painel para conferir os detalhes e dar seu feedback.</p>
            <a href="https://${Deno.env.get("PUBLIC_URL") || 'calendario.lovable.app'}" 
               style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
              Ver Painel
            </a>
          </div>
        `,
      }),
    });

    if (res.ok) {
      await supabaseClient
        .from("post_notifications")
        .update({ sent: true })
        .eq("id", record.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
