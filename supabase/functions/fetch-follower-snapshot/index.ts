import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL') || ""
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
    const apifyToken = Deno.env.get('APIFY_API_TOKEN')

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor ausente (SUPABASE_URL / SERVICE_ROLE_KEY)" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!apifyToken) {
      return new Response(JSON.stringify({ error: "APIFY_API_TOKEN não configurado" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body: any = {}
    try { body = await req.json() } catch (_) { body = {} }
    const onlyStudentId: string | undefined = body?.student_id

    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase.from('students').select('id, name, instagram_handle, tiktok_handle, avatar_url')
    if (onlyStudentId) query = query.eq('id', onlyStudentId)
    const { data: students, error: studentError } = await query
    if (studentError) throw studentError

    console.log(`[snapshot] processing ${students?.length || 0} student(s)`)
    const results: any[] = []

    const persistAvatar = async (studentId: string, picUrl: string | undefined | null) => {
      if (!picUrl) return null
      try {
        const imgRes = await fetch(picUrl)
        if (!imgRes.ok) { console.warn('[avatar] fetch fail', imgRes.status); return null }
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const ext = contentType.includes('png') ? 'png' : 'jpg'
        const bytes = new Uint8Array(await imgRes.arrayBuffer())
        const path = `${studentId}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('student-avatars')
          .upload(path, bytes, { contentType, upsert: true, cacheControl: '3600' })
        if (upErr) { console.error('[avatar] upload', upErr); return null }
        const { data: pub } = supabase.storage.from('student-avatars').getPublicUrl(path)
        const url = `${pub.publicUrl}?v=${Date.now()}`
        await supabase.from('students').update({ avatar_url: url }).eq('id', studentId)
        return url
      } catch (e) {
        console.error('[avatar] err', e)
        return null
      }
    }

    for (const student of students || []) {
      // Instagram
      if (student.instagram_handle) {
        try {
          const igRes = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [student.instagram_handle.replace(/^@/, '')] })
          })
          const items = await igRes.json()
          const profile = Array.isArray(items) ? items[0] : null
          console.log(`[snapshot][ig] ${student.name} followers=${profile?.followersCount}`)

          if (profile && profile.followersCount !== undefined) {
            const { error: upsertError } = await supabase
              .from('follower_snapshots')
              .upsert({
                student_id: student.id,
                platform: 'instagram',
                handle: student.instagram_handle,
                followers: profile.followersCount,
                follows: profile.followsCount || 0,
                posts_count: profile.postsCount || 0,
                raw: profile,
              }, { onConflict: 'student_id, platform, captured_date' })
            if (upsertError) console.error("[snapshot][ig] upsert", upsertError)
            results.push({ student: student.name, platform: 'instagram', status: upsertError ? 'error' : 'success', followers: profile.followersCount })
          } else {
            results.push({ student: student.name, platform: 'instagram', status: 'no_data' })
          }
        } catch (e: any) {
          console.error("[snapshot][ig] err", e)
          results.push({ student: student.name, platform: 'instagram', status: 'error', message: e.message })
        }
      }

      // TikTok
      if (student.tiktok_handle) {
        try {
          const ttRes = await fetch(`https://api.apify.com/v2/acts/clockworks~tiktok-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profiles: [student.tiktok_handle.replace(/^@/, '')], resultsPerPage: 1 })
          })
          const items = await ttRes.json()
          const item = Array.isArray(items) ? items[0] : null
          const profile = item?.authorMeta || item
          const followers = profile?.fans ?? profile?.followerCount
          console.log(`[snapshot][tt] ${student.name} followers=${followers}`)

          if (profile && followers !== undefined) {
            const { error: upsertError } = await supabase
              .from('follower_snapshots')
              .upsert({
                student_id: student.id,
                platform: 'tiktok',
                handle: student.tiktok_handle,
                followers: followers,
                follows: profile.following || profile.followingCount || 0,
                posts_count: profile.video || profile.videoCount || 0,
                raw: profile,
              }, { onConflict: 'student_id, platform, captured_date' })
            if (upsertError) console.error("[snapshot][tt] upsert", upsertError)
            results.push({ student: student.name, platform: 'tiktok', status: upsertError ? 'error' : 'success', followers })
          } else {
            results.push({ student: student.name, platform: 'tiktok', status: 'no_data' })
          }
        } catch (e: any) {
          console.error("[snapshot][tt] err", e)
          results.push({ student: student.name, platform: 'tiktok', status: 'error', message: e.message })
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error("[snapshot] unhandled", error)
    return new Response(JSON.stringify({ error: error.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
