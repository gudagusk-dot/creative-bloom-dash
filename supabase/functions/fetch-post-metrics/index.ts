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
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=90`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Apify ${actorId} failed [${res.status}]: ${txt.slice(0, 300)}`);
  }
  const items = await res.json();
  return Array.isArray(items) ? items[0] : items;
}

async function scrape(url: string) {
  const platform = detectPlatform(url);
  if (!platform) throw new Error("URL não reconhecida (use Instagram ou TikTok)");

  if (platform === "instagram") {
    const item = await runActor("apify~instagram-post-scraper", {
      username: [],
      directUrls: [url],
      resultsLimit: 1,
    });
    return {
      platform,
      likes: item?.likesCount ?? 0,
      comments: item?.commentsCount ?? 0,
      views: item?.videoViewCount ?? item?.videoPlayCount ?? 0,
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
    return {
      platform,
      likes: item?.diggCount ?? 0,
      comments: item?.commentCount ?? 0,
      views: item?.playCount ?? 0,
      shares: item?.shareCount ?? 0,
      raw: item ?? {},
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: "APIFY_API_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const postIds: string[] = Array.isArray(body.post_ids) ? body.post_ids : (body.post_id ? [body.post_id] : []);
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
    if (pErr) throw pErr;

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
        if (upErr) throw upErr;
        results.push({ post_id: p.id, ok: true, metrics: m });
      } catch (e) {
        results.push({ post_id: p.id, ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
