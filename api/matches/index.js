// Vercel Serverless Function: Get Matches
// Fetches matches for a user from Supabase

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
      const { userId } = req.query

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      if (!supabase) {
        return res.status(200).json({ data: [], source: 'mock' })
      }

      // Get matches for user
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:users!matches_user1_id_fkey(id, profiles(*)),
          user2:users!matches_user2_id_fkey(id, profiles(*))
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'ACTIVE')
        .order('matched_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({ data: data || [], source: 'supabase' })
    } catch (error) {
      console.error('Error fetching matches:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    // Create a new match (when mutual like occurs)
    try {
      const { user1Id, user2Id } = req.body

      if (!user1Id || !user2Id) {
        return res.status(400).json({ error: 'user1Id and user2Id are required' })
      }

      if (!supabase) {
        return res.status(200).json({ data: { id: 'mock-match-id' }, source: 'mock' })
      }

      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .single()

      if (existingMatch) {
        return res.status(200).json({ data: existingMatch, source: 'existing' })
      }

      // Create new match
      const { data, error } = await supabase
        .from('matches')
        .insert({
          user1_id: user1Id,
          user2_id: user2Id,
          status: 'ACTIVE',
          matched_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ data, source: 'created' })
    } catch (error) {
      console.error('Error creating match:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
