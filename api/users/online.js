// Vercel Serverless Function: Get Online Users Count
// Tracks real-time online users

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client (if available)
let supabase = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
  } catch (error) {
    console.error('Error initializing Supabase:', error)
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    try {
      // If no Supabase, return mock count
      if (!supabase) {
        return res.status(200).json({
          onlineCount: 25,
          source: 'mock'
        })
      }

      // Get online users (active in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      try {
        const { count, error } = await supabase
          .from('login_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('last_active_at', fiveMinutesAgo)

        if (error) throw error

        return res.status(200).json({
          onlineCount: count || 0,
          source: 'supabase'
        })
      } catch (error) {
        // If login_sessions table doesn't exist, estimate
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const estimatedOnline = Math.floor((totalUsers || 0) * 0.1) // 10% online estimate

        return res.status(200).json({
          onlineCount: estimatedOnline,
          source: 'estimated'
        })
      }
    } catch (error) {
      console.error('Error fetching online users:', error)
      return res.status(500).json({ 
        error: error.message || 'Internal server error',
        onlineCount: 0
      })
    }
  }

  if (req.method === 'POST') {
    // Update user's last active time
    try {
      const { userId } = req.body

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      if (!supabase) {
        return res.status(200).json({ success: true, source: 'mock' })
      }

      // Upsert login session
      const { error } = await supabase
        .from('login_sessions')
        .upsert({
          user_id: userId,
          last_active_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error updating online status:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
