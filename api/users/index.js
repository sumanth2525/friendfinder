// Vercel Serverless Function: Get Users/Profiles
// Fetches user profiles from Supabase

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
    const { userId, limit = 20, gender, minAge, maxAge, location } = req.query

    if (!supabase) {
      return res.status(200).json({ data: [], source: 'mock' })
    }

    let query = supabase
      .from('profiles')
      .select('*, user_interests(interest:interests(*))')

    // Filter by userId if provided
    if (userId) {
      query = query.eq('user_id', userId).single()
    } else {
      // Apply filters for multiple users
      if (gender) {
        query = query.eq('gender', gender)
      }
      if (minAge) {
        query = query.gte('age', parseInt(minAge))
      }
      if (maxAge) {
        query = query.lte('age', parseInt(maxAge))
      }
      if (location) {
        query = query.ilike('location', `%${location}%`)
      }

      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) throw error

    // Format interests
    const formattedData = Array.isArray(data) 
      ? data.map(profile => ({
          ...profile,
          interests: profile.user_interests?.map(ui => ui.interest?.name || ui.interest) || []
        }))
      : {
          ...data,
          interests: data?.user_interests?.map(ui => ui.interest?.name || ui.interest) || []
        }

    return res.status(200).json({ 
      data: formattedData, 
      source: 'supabase' 
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
