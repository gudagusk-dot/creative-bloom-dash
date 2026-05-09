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
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || ""
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || ""
    const apifyToken = Deno.env.get('APIFY_API_TOKEN')
    
    if (!apifyToken) {
      return new Response(JSON.stringify({ error: "APIFY_API_TOKEN not set" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Fetch all students with handles
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name, instagram_handle, tiktok_handle')

    if (studentError) throw studentError

    const results = []

    for (const student of students) {
      // Instagram
      if (student.instagram_handle) {
        try {
          const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [student.instagram_handle] })
          })
          
          const items = await response.json()
          const profile = items[0]
          
          if (profile && profile.followersCount !== undefined) {
            const { error: upsertError } = await supabase
              .from('follower_snapshots')
              .upsert({
                student_id: student.id,
                platform: 'Instagram',
                handle: student.instagram_handle,
                followers: profile.followersCount,
                follows: profile.followsCount,
                posts_count: profile.postsCount,
                raw: profile
              }, { onConflict: 'student_id, platform, captured_date' })
              
            results.push({ student: student.name, platform: 'Instagram', status: upsertError ? 'error' : 'success' })
          }
        } catch (e) {
          results.push({ student: student.name, platform: 'Instagram', status: 'error', message: e.message })
        }
      }

      // TikTok
      if (student.tiktok_handle) {
        try {
          const response = await fetch(`https://api.apify.com/v2/acts/apify~tiktok-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernames: [student.tiktok_handle], resultsPerPage: 1 })
          })
          
          const items = await response.json()
          const profile = items[0]?.authorMeta
          
          if (profile && profile.followerCount !== undefined) {
            const { error: upsertError } = await supabase
              .from('follower_snapshots')
              .upsert({
                student_id: student.id,
                platform: 'TikTok',
                handle: student.tiktok_handle,
                followers: profile.followerCount,
                follows: profile.followingCount,
                posts_count: profile.videoCount,
                raw: profile
              }, { onConflict: 'student_id, platform, captured_date' })
              
            results.push({ student: student.name, platform: 'TikTok', status: upsertError ? 'error' : 'success' })
          }
        } catch (e) {
          results.push({ student: student.name, platform: 'TikTok', status: 'error', message: e.message })
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
