// Edge function: apify-tools
// Unified router for Apify actors: post, profile, hashtag, comments (IG + TikTok)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APIFY_TOKEN = Deno.env.get("APIFY_API_TOKEN");

type Platform = "instagram" | "tiktok";

const detectPlatformFromUrl = (url: string): Platform | null => {
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return null;
};

// For profile / hashtag inputs we accept either URL or handle/hashtag + explicit platform
const cleanHandle = (h: string) => h.trim().replace(/^@/, "").replace(/^#/, "");

async function runActor(actorId: string, input: Record<string, unknown>) {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=180`;
  console.log(`[apify] actor=${actorId} input=${JSON.stringify(input).slice(0, 300)}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  console.log(`[apify] actor=${actorId} status=${res.status}`);
  if (!res.ok) {
    const txt = await res.text();
    console.error(`[apify] error: ${txt.slice(0, 500)}`);
    throw new Error(`Apify ${actorId} falhou [${res.status}]: ${txt.slice(0, 200)}`);
  }
  const items = await res.json();
  return Array.isArray(items) ? items : [items];
}

// ---------- POST ----------
async function scrapePost(url: string) {
  const platform = detectPlatformFromUrl(url);
  if (!platform) throw new Error("URL não reconhecida (use Instagram ou TikTok)");

  if (platform === "instagram") {
    const [item] = await runActor("apify~instagram-scraper", {
      directUrls: [url],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
    });
    if (!item) throw new Error("Post do Instagram não encontrado ou privado");
    const hashtags: string[] = item.hashtags || [];
    return {
      platform,
      url,
      author: item.ownerUsername || item.ownerFullName || "",
      caption: item.caption || "",
      hashtags,
      mentions: item.mentions || [],
      music: item.musicInfo?.song_name || null,
      duration: item.videoDuration || null,
      posted_at: item.timestamp || null,
      metrics: {
        likes: Number(item.likesCount) || 0,
        comments: Number(item.commentsCount) || 0,
        views: Number(item.videoViewCount ?? item.videoPlayCount) || 0,
        shares: 0,
      },
      media: {
        thumbnail: item.displayUrl || null,
        video_url: item.videoUrl || null,
        images: item.images || [],
      },
    };
  } else {
    const [item] = await runActor("clockworks~tiktok-scraper", {
      postURLs: [url],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });
    if (!item) throw new Error("Post do TikTok não encontrado ou privado");
    const hashtags: string[] = (item.hashtags || []).map((h: any) => h?.name || h).filter(Boolean);
    return {
      platform,
      url,
      author: item.authorMeta?.name || item.authorMeta?.nickName || "",
      caption: item.text || "",
      hashtags,
      mentions: item.mentions || [],
      music: item.musicMeta?.musicName || null,
      duration: item.videoMeta?.duration || null,
      posted_at: item.createTimeISO || null,
      metrics: {
        likes: Number(item.diggCount) || 0,
        comments: Number(item.commentCount) || 0,
        views: Number(item.playCount) || 0,
        shares: Number(item.shareCount) || 0,
      },
      media: {
        thumbnail: item.videoMeta?.coverUrl || item.covers?.[0] || null,
        video_url: item.videoUrl || null,
        images: [],
      },
    };
  }
}

// ---------- PROFILE ----------
async function scrapeProfile(input: { url?: string; handle?: string; platform?: Platform }) {
  let platform = input.platform || (input.url ? detectPlatformFromUrl(input.url) : null);
  let handle = input.handle ? cleanHandle(input.handle) : null;
  if (input.url && !handle) {
    const m = input.url.match(/(?:instagram\.com|tiktok\.com)\/@?([A-Za-z0-9._-]+)/i);
    if (m) handle = m[1];
  }
  if (!platform) throw new Error("Plataforma não detectada (envie URL completa do perfil)");
  if (!handle) throw new Error("Handle do perfil não detectado");

  if (platform === "instagram") {
    const items = await runActor("apify~instagram-profile-scraper", {
      usernames: [handle],
      resultsLimit: 12,
    });
    const p = items[0];
    if (!p) throw new Error("Perfil do Instagram não encontrado");
    return {
      platform,
      handle,
      full_name: p.fullName || "",
      bio: p.biography || "",
      followers: Number(p.followersCount) || 0,
      following: Number(p.followsCount) || 0,
      posts_count: Number(p.postsCount) || 0,
      avatar: p.profilePicUrl || null,
      verified: !!p.verified,
      top_posts: (p.latestPosts || []).slice(0, 12).map((x: any) => ({
        url: x.url,
        caption: x.caption || "",
        likes: Number(x.likesCount) || 0,
        comments: Number(x.commentsCount) || 0,
        views: Number(x.videoViewCount ?? x.videoPlayCount) || 0,
        thumbnail: x.displayUrl || null,
      })),
    };
  } else {
    const items = await runActor("clockworks~tiktok-profile-scraper", {
      profiles: [handle],
      resultsPerPage: 12,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });
    const first = items[0];
    if (!first) throw new Error("Perfil do TikTok não encontrado");
    const meta = first.authorMeta || {};
    return {
      platform,
      handle,
      full_name: meta.nickName || "",
      bio: meta.signature || "",
      followers: Number(meta.fans) || 0,
      following: Number(meta.following) || 0,
      posts_count: Number(meta.video) || 0,
      avatar: meta.avatar || null,
      verified: !!meta.verified,
      top_posts: items.slice(0, 12).map((x: any) => ({
        url: x.webVideoUrl,
        caption: x.text || "",
        likes: Number(x.diggCount) || 0,
        comments: Number(x.commentCount) || 0,
        views: Number(x.playCount) || 0,
        shares: Number(x.shareCount) || 0,
        thumbnail: x.videoMeta?.coverUrl || null,
      })),
    };
  }
}

// ---------- HASHTAG ----------
async function scrapeHashtag(input: { hashtag: string; platform: Platform }) {
  const tag = cleanHandle(input.hashtag);
  if (!tag) throw new Error("Hashtag inválida");
  const platform = input.platform;

  if (platform === "instagram") {
    const items = await runActor("apify~instagram-hashtag-scraper", {
      hashtags: [tag],
      resultsLimit: 12,
    });
    return {
      platform,
      hashtag: tag,
      top_posts: items.slice(0, 12).map((x: any) => ({
        url: x.url,
        author: x.ownerUsername || "",
        caption: x.caption || "",
        likes: Number(x.likesCount) || 0,
        comments: Number(x.commentsCount) || 0,
        views: Number(x.videoViewCount ?? x.videoPlayCount) || 0,
        thumbnail: x.displayUrl || null,
      })),
    };
  } else {
    const items = await runActor("clockworks~tiktok-scraper", {
      hashtags: [tag],
      resultsPerPage: 12,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });
    return {
      platform,
      hashtag: tag,
      top_posts: items.slice(0, 12).map((x: any) => ({
        url: x.webVideoUrl,
        author: x.authorMeta?.name || "",
        caption: x.text || "",
        likes: Number(x.diggCount) || 0,
        comments: Number(x.commentCount) || 0,
        views: Number(x.playCount) || 0,
        shares: Number(x.shareCount) || 0,
        thumbnail: x.videoMeta?.coverUrl || null,
      })),
    };
  }
}

// ---------- COMMENTS ----------
async function scrapeComments(url: string) {
  const platform = detectPlatformFromUrl(url);
  if (!platform) throw new Error("URL não reconhecida (use Instagram ou TikTok)");

  if (platform === "instagram") {
    const items = await runActor("apify~instagram-comment-scraper", {
      directUrls: [url],
      resultsLimit: 30,
    });
    return {
      platform,
      url,
      comments: items.slice(0, 30).map((x: any) => ({
        author: x.ownerUsername || "",
        text: x.text || "",
        likes: Number(x.likesCount) || 0,
      })),
    };
  } else {
    const items = await runActor("clockworks~tiktok-comments-scraper", {
      postURLs: [url],
      commentsPerPost: 30,
    });
    return {
      platform,
      url,
      comments: items.slice(0, 30).map((x: any) => ({
        author: x.uniqueId || x.user?.uniqueId || "",
        text: x.text || "",
        likes: Number(x.diggCount) || 0,
      })),
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
    const tool: string = body.tool;
    const input = body.input || {};
    if (!tool) {
      return new Response(JSON.stringify({ error: "Campo 'tool' obrigatório (post|profile|hashtag|comments)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    if (tool === "post") {
      if (!input.url) throw new Error("input.url obrigatório");
      result = await scrapePost(String(input.url));
    } else if (tool === "profile") {
      result = await scrapeProfile(input);
    } else if (tool === "hashtag") {
      if (!input.hashtag || !input.platform) throw new Error("input.hashtag e input.platform obrigatórios");
      result = await scrapeHashtag({ hashtag: String(input.hashtag), platform: input.platform });
    } else if (tool === "comments") {
      if (!input.url) throw new Error("input.url obrigatório");
      result = await scrapeComments(String(input.url));
    } else {
      throw new Error(`Tool desconhecida: ${tool}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[apify-tools] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
