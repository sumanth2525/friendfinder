// Vercel Serverless Function: Calculate Match Percentage
// Moves heavy matching algorithm computation to backend

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

/**
 * Matching Algorithm Weights:
 * - Hobbies/Interests: 60%
 * - Job: 5%
 * - Age: 10%
 * - Location: 10%
 * - Lifestyle: 10%
 * - Education: 5%
 */

// Helper functions (same as client-side)
const calculateHobbiesScore = (interests1, interests2) => {
  if (!interests1?.length && !interests2?.length) return 50
  if (!interests1?.length || !interests2?.length) return 0

  const set1 = new Set(
    interests1.map(i => 
      typeof i === 'string' ? i.toLowerCase().trim() : i.name?.toLowerCase().trim() || ''
    ).filter(Boolean)
  )
  const set2 = new Set(
    interests2.map(i => 
      typeof i === 'string' ? i.toLowerCase().trim() : i.name?.toLowerCase().trim() || ''
    ).filter(Boolean)
  )

  const common = [...set1].filter(i => set2.has(i)).length
  const total = new Set([...set1, ...set2]).size

  return total > 0 ? (common / total) * 100 : 0
}

const calculateJobScore = (job1, job2) => {
  if (!job1 && !job2) return 50
  if (!job1 || !job2) return 0

  const j1 = job1.toLowerCase().trim()
  const j2 = job2.toLowerCase().trim()

  if (j1 === j2) return 100

  if (j1.includes(j2) || j2.includes(j1)) return 50

  const industries = {
    tech: ['software', 'developer', 'engineer', 'programmer', 'it', 'technology'],
    healthcare: ['doctor', 'nurse', 'medical', 'health', 'hospital'],
    education: ['teacher', 'professor', 'educator', 'school'],
    finance: ['banker', 'accountant', 'financial', 'finance', 'investment'],
    marketing: ['marketing', 'advertising', 'brand', 'pr', 'public relations'],
    design: ['designer', 'graphic', 'ui', 'ux', 'creative'],
  }

  for (const [industry, keywords] of Object.entries(industries)) {
    const match1 = keywords.some(k => j1.includes(k))
    const match2 = keywords.some(k => j2.includes(k))
    if (match1 && match2) return 50
  }

  return 0
}

const calculateAgeScore = (age1, age2) => {
  if (!age1 || !age2) return 50

  const ageDiff = Math.abs(age1 - age2)

  if (ageDiff === 0) return 100
  if (ageDiff <= 2) return 80
  if (ageDiff <= 5) return 60
  if (ageDiff <= 10) return 40
  if (ageDiff <= 15) return 20
  return 10
}

const calculateLocationScore = (location1, location2) => {
  if (!location1 && !location2) return 50
  if (!location1 || !location2) return 0

  const loc1 = location1.toLowerCase().trim()
  const loc2 = location2.toLowerCase().trim()

  if (loc1 === loc2) return 100

  const city1 = loc1.split(',')[0].trim()
  const city2 = loc2.split(',')[0].trim()
  if (city1 === city2) return 70

  const state1 = loc1.split(',')[1]?.trim()
  const state2 = loc2.split(',')[1]?.trim()
  if (state1 && state2 && state1 === state2) return 50

  return 30
}

const calculateLifestyleScore = (lifestyle1, lifestyle2) => {
  let matches = 0
  let total = 0

  const factors = ['drinking', 'smoking', 'exercise', 'pets']

  factors.forEach(factor => {
    if (lifestyle1?.[factor] && lifestyle2?.[factor]) {
      total++
      if (lifestyle1[factor].toLowerCase() === lifestyle2[factor].toLowerCase()) {
        matches++
      }
    }
  })

  if (total === 0) return 50

  return (matches / total) * 100
}

const calculateEducationScore = (edu1, edu2) => {
  if (!edu1 && !edu2) return 50
  if (!edu1 || !edu2) return 0

  const e1 = edu1.toLowerCase().trim()
  const e2 = edu2.toLowerCase().trim()

  if (e1 === e2) return 100

  const higherEd = ['university', 'college', 'bachelor', 'master', 'phd', 'doctorate']
  const hasHigher1 = higherEd.some(term => e1.includes(term))
  const hasHigher2 = higherEd.some(term => e2.includes(term))

  if (hasHigher1 && hasHigher2) return 60
  if (!hasHigher1 && !hasHigher2) return 60

  return 20
}

/**
 * Main match calculation function
 */
const calculateMatchPercentage = (user1, user2) => {
  let totalScore = 0

  // 1. HOBBIES SCORE (60%)
  const hobbiesScore = calculateHobbiesScore(user1.interests || [], user2.interests || [])
  totalScore += hobbiesScore * 0.60

  // 2. JOB SCORE (5%)
  const jobScore = calculateJobScore(user1.job_title || user1.job, user2.job_title || user2.job)
  totalScore += jobScore * 0.05

  // 3. AGE SCORE (10%)
  const ageScore = calculateAgeScore(user1.age, user2.age)
  totalScore += ageScore * 0.10

  // 4. LOCATION SCORE (10%)
  const locationScore = calculateLocationScore(user1.location, user2.location)
  totalScore += locationScore * 0.10

  // 5. LIFESTYLE SCORE (10%)
  const lifestyleScore = calculateLifestyleScore(user1.lifestyle || {}, user2.lifestyle || {})
  totalScore += lifestyleScore * 0.10

  // 6. EDUCATION SCORE (5%)
  const educationScore = calculateEducationScore(user1.education, user2.education)
  totalScore += educationScore * 0.05

  // Round and clamp between 0-100
  return Math.min(100, Math.max(0, Math.round(totalScore)))
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, targetUserId, user1Data, user2Data } = req.body

    // If user data is provided directly, use it
    if (user1Data && user2Data) {
      const score = calculateMatchPercentage(user1Data, user2Data)
      return res.status(200).json({ 
        score,
        compatible: score >= 70,
        breakdown: {
          hobbies: calculateHobbiesScore(user1Data.interests || [], user2Data.interests || []),
          job: calculateJobScore(user1Data.job_title || user1Data.job, user2Data.job_title || user2Data.job),
          age: calculateAgeScore(user1Data.age, user2Data.age),
          location: calculateLocationScore(user1Data.location, user2Data.location),
          lifestyle: calculateLifestyleScore(user1Data.lifestyle || {}, user2Data.lifestyle || {}),
          education: calculateEducationScore(user1Data.education, user2Data.education)
        }
      })
    }

    // If user IDs are provided, fetch from Supabase
    if (userId && targetUserId && supabase) {
      // Try using Supabase RPC function first (if available)
      try {
        const { data, error } = await supabase.rpc('calculate_match_percentage', {
          p_user1_id: userId,
          p_user2_id: targetUserId
        })

        if (!error && data !== null) {
          return res.status(200).json({ 
            score: data,
            compatible: data >= 70,
            source: 'supabase_rpc'
          })
        }
      } catch (rpcError) {
        console.log('RPC function not available, fetching user data directly')
      }

      // Fallback: Fetch user profiles and calculate
      const { data: user1, error: error1 } = await supabase
        .from('profiles')
        .select('*, user_interests(interest:interests(*))')
        .eq('user_id', userId)
        .single()

      const { data: user2, error: error2 } = await supabase
        .from('profiles')
        .select('*, user_interests(interest:interests(*))')
        .eq('user_id', targetUserId)
        .single()

      if (error1 || error2 || !user1 || !user2) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Format interests
      const user1Data = {
        ...user1,
        interests: user1.user_interests?.map(ui => ui.interest?.name || ui.interest) || []
      }

      const user2Data = {
        ...user2,
        interests: user2.user_interests?.map(ui => ui.interest?.name || ui.interest) || []
      }

      const score = calculateMatchPercentage(user1Data, user2Data)

      return res.status(200).json({ 
        score,
        compatible: score >= 70,
        breakdown: {
          hobbies: calculateHobbiesScore(user1Data.interests || [], user2Data.interests || []),
          job: calculateJobScore(user1Data.job_title || user1Data.job, user2Data.job_title || user2Data.job),
          age: calculateAgeScore(user1Data.age, user2Data.age),
          location: calculateLocationScore(user1Data.location, user2Data.location),
          lifestyle: calculateLifestyleScore(user1Data.lifestyle || {}, user2Data.lifestyle || {}),
          education: calculateEducationScore(user1Data.education, user2Data.education)
        },
        source: 'calculated'
      })
    }

    return res.status(400).json({ error: 'Missing required parameters' })
  } catch (error) {
    console.error('Error calculating match:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
