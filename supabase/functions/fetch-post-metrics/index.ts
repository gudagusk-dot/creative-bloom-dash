// Edge function: fetch-post-metrics
// Scrapes Instagram / TikTok post metrics using Apify free-tier actors.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const detectPlatform = (url: string): "instagram" | "tiktok" | null => {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return null;
};

async function runActor(actorId: string, input: Record<string, unknown>) {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=180`;
  console.log(`[apify] calling actor=${actorId} input=${JSON.stringify(input)}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  console.log(`[apify] actor=${actorId} status=${res.status}`);
  if (!res.ok) {
    const txt = await res.text();
    console.error(`[apify] error body: ${txt.slice(0, 500)}`);
    throw new Error(`Apify ${actorId} falhou [${res.status}]: ${txt.slice(0, 200)}`);
  }
  const items = await res.json();
  console.log(`[apify] received ${Array.isArray(items) ? items.length : 0} items`);
  return Array.isArray(items) ? items[0] : items;
}

async function scrape(url: string) {
  const platform = detectPlatform(url);
  if (!platform) throw new Error("URL não reconhecida (use Instagram ou TikTok)");
  console.log(`[scrape] platform=${platform} url=${url}`);

  if (platform === "instagram") {
    const item = await runActor("apify~instagram-post-scraper", {
      directUrls: [url],
      resultsLimit: 1,
    });
    if (!item) throw new Error("Post do Instagram não encontrado ou privado");
    return {
      platform,
      likes: Number(item?.likesCount) || 0,
      comments: Number(item?.commentsCount) || 0,
      views: Number(item?.videoViewCount ?? item?.videoPlayCount) || 0,
      shares: 0,
      raw: item ?? {},
    };
  } else {
    const item = await runActor("clockworks~tiktok-scraper", {
      postURLs: [url],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });
    if (!item) throw new Error("Post do TikTok não encontrado ou privado");
    return {
      platform,
      likes: Number(item?.diggCount) || 0,
      comments: Number(item?.commentCount) || 0,
      views: Number(item?.playCount) || 0,
      shares: Number(item?.shareCount) || 0,
      raw: item ?? {},
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!APIFY_TOKEN) {
      console.error("APIFY_API_TOKEN ausente");
      return new Response(JSON.stringify({ error: "APIFY_API_TOKEN não configurado no projeto" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const postIds: string[] = Array.isArray(body.post_ids) ? body.post_ids : (body.post_id ? [body.post_id] : []);
    console.log(`[req] post_ids=${postIds.length}`);
    if (!postIds.length) {
      return new Response(JSON.stringify({ error: "post_id ou post_ids requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: posts, error: pErr } = await supabase
      .from("content_posts")
      .select("id, published_url, title")
      .in("id", postIds);
    if (pErr) {
      console.error("[db] select error", pErr);
      throw pErr;
    }
    console.log(`[db] found ${posts?.length || 0} posts`);

    const results: Array<{ post_id: string; ok: boolean; error?: string; metrics?: any }> = [];

    for (const p of posts ?? []) {
      if (!p.published_url) {
        results.push({ post_id: p.id, ok: false, error: "Sem link publicado" });
        continue;
      }
      try {
        const m = await scrape(p.published_url);
        const engagement = m.views > 0 ? ((m.likes + m.comments + m.shares) / m.views) * 100 : 0;
        const { error: upErr } = await supabase
          .from("post_metrics")
          .upsert({
            post_id: p.id,
            platform: m.platform,
            likes: m.likes,
            views: m.views,
            comments: m.comments,
            shares: m.shares,
            engagement_rate: Number(engagement.toFixed(2)),
            raw: m.raw,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "post_id" });
        if (upErr) {
          console.error("[db] upsert error", upErr);
          throw upErr;
        }
        console.log(`[ok] post=${p.id} likes=${m.likes} views=${m.views}`);
        results.push({ post_id: p.id, ok: true, metrics: m });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[fail] post=${p.id} ${msg}`);
        results.push({ post_id: p.id, ok: false, error: msg });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[fatal]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
