// Vercel Serverless Function: Get Member Statistics and Insights
// Calculates member stats server-side for better performance

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // If no Supabase, return mock data
    if (!supabase) {
      return res.status(200).json({
        menCount: 150,
        womenCount: 120,
        onlineCount: 25,
        totalCount: 270,
        source: 'mock'
      })
    }

    // Try RPC function first (most efficient)
    try {
      const { data, error } = await supabase.rpc('get_member_stats')
      
      if (!error && data) {
        return res.status(200).json({
          menCount: data.men_count || 0,
          womenCount: data.women_count || 0,
          onlineCount: data.online_count || 0,
          totalCount: (data.men_count || 0) + (data.women_count || 0),
          source: 'supabase_rpc'
        })
      }
    } catch (rpcError) {
      console.log('RPC function not available, using direct queries')
    }

    // Fallback: Direct queries
    // Get count of men
    const { count: menCount, error: menError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Male')

    // Get count of women
    const { count: womenCount, error: womenError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Female')

    // Get online users (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    let onlineCount = 0
    
    try {
      const { count, error: onlineError } = await supabase
        .from('login_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', fiveMinutesAgo)
      
      onlineCount = count || 0
    } catch (onlineError) {
      // If login_sessions table doesn't exist, estimate based on total users
      onlineCount = Math.floor(((menCount || 0) + (womenCount || 0)) * 0.1) // 10% online estimate
    }

    if (menError || womenError) {
      console.error('Error fetching member stats:', { menError, womenError })
      // Return mock data on error
      return res.status(200).json({
        menCount: 150,
        womenCount: 120,
        onlineCount: 25,
        totalCount: 270,
        source: 'mock_fallback'
      })
    }

    return res.status(200).json({
      menCount: menCount || 0,
      womenCount: womenCount || 0,
      onlineCount: onlineCount || 0,
      totalCount: (menCount || 0) + (womenCount || 0),
      source: 'supabase_direct'
    })
  } catch (error) {
    console.error('Error in insights/stats:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      menCount: 0,
      womenCount: 0,
      onlineCount: 0,
      totalCount: 0,
      source: 'error'
    })
  }
}
